import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Único camino público del frontend -- todo lo demás requiere sesión. Mismo
 * espíritu "seguro por defecto" que ya tiene Nexit_Back (`BaseController`
 * exige `[Authorize]` en toda acción; `[AllowAnonymous]` es la excepción
 * única y documentada, ver `docs/30` del backend): acá el login (correo,
 * código, contraseña) es esa excepción, todo lo demás -- incluida la ruta
 * raíz "/" y cualquier ruta que no exista -- se trata como protegido por
 * defecto, no al revés. Así una ruta nueva que alguien agregue mañana queda
 * protegida automáticamente en vez de tener que acordarse de agregarla acá.
 */
const PUBLIC_PATHS = new Set(["/login"]);

/** Mismo destino que usan login/page.tsx (goToDashboard) y el "/" actual (RootPage). */
const DEFAULT_AUTHENTICATED_PATH = "/proveedores";
const LOGIN_PATH = "/login";

/**
 * Corre en cada request, antes de que se sirva cualquier página (ver
 * `src/proxy.ts` y la guía de autenticación de Next.js, sección "Optimistic
 * checks with Proxy": node_modules/next/dist/docs/01-app/02-guides/authentication.md).
 *
 * Esto NO reemplaza la autorización real -- esa sigue viviendo en
 * Nexit_Back, que valida el JWT en cada endpoint de datos -- pero cierra un
 * hueco real que sí existía: antes de esto, alguien sin sesión igual
 * recibía el HTML/JS completo del dashboard (sin datos reales, porque las
 * llamadas a la API fallaban con 401), y recién ahí, ya en el navegador, se
 * le redirigía con un `if (!user) return null` en `(dashboard)/layout.tsx`.
 * La propia guía de Next.js desaconseja apoyarse solo en ese patrón
 * ("A common pattern in SPAs is to return null... this pattern is NOT
 * recommended"). Con esto, quien no tiene una sesión válida nunca llega a
 * recibir el HTML de una ruta protegida: la respuesta es un redirect 307 a
 * /login directamente, antes de que Next arme la página. El guard del lado
 * del navegador se deja igual, como segunda capa (por ejemplo, para cuando
 * la sesión expira mientras la persona ya está adentro).
 *
 * Usa `getClaims()` -- no `getSession()` (la propia documentación de
 * Supabase para SSR advierte: "Never trust supabase.auth.getSession()
 * inside server code such as Proxy. It isn't guaranteed to revalidate the
 * Auth token") ni `getUser()` (sí revalida, pero siempre contra la red).
 * `getClaims()` valida la firma del JWT localmente contra las claves
 * públicas del proyecto (rápido, sin ida y vuelta de red en el caso normal
 * -- proyecto con claves asimétricas, el modo recomendado, ver
 * Nexit_Back/docs/05-plan-remediacion-seguridad.md H1) y solo cae a una
 * verificación por red si el proyecto todavía usa el modo heredado de
 * secreto compartido -- funciona igual de bien en ambos casos, sin que este
 * archivo necesite saber cuál usa el proyecto.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Entorno mal configurado: no bloqueamos a todo el mundo por un
    // despliegue roto. El cliente del navegador (supabase-client.ts) ya
    // lanza su propio error claro apenas carga en ese caso.
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // Llamado por el cliente cuando refresca el token -- hay que
      // reflejar las cookies nuevas tanto en el request (para que el resto
      // de este mismo ciclo las vea) como en la response (para que las
      // reciba el navegador). Ver el aviso de @supabase/ssr: implementar
      // esto mal produce cierres de sesión aleatorios difíciles de
      // diagnosticar.
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.has(path);
  const isRoot = path === "/";

  // Sin sesión y pidiendo cualquier cosa que no sea el login (incluida "/"
  // y cualquier ruta desconocida): a /login, directo, antes de servir nada.
  if (!isAuthenticated && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  // Con sesión y pidiendo el login o la raíz: no tiene sentido mostrarle el
  // login otra vez, se manda directo al dashboard.
  if (isAuthenticated && (isPublicPath || isRoot)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHENTICATED_PATH;
    return NextResponse.redirect(url);
  }

  return response;
}

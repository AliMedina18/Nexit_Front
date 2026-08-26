"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, FieldGroup, Input, Row, Select, Textarea } from "@/components/ui/form";
import { StarRatingInput } from "@/components/ui/StarRating";
import { citiesForRegion, regionLabel, regionsForCountry } from "@/lib/geo-helpers";
import { GEO } from "@/lib/geo";
import {
  BUDGET_TIERS,
  COVERAGE_LEVELS,
  PROVIDER_CATEGORIES,
  PROVIDER_STATUSES,
} from "@/types/domain";
import type { Provider, ProviderInput } from "@/types/domain";

const OTRO = "__otro__";

interface FormState {
  nombre: string;
  pais: string;
  region: string;
  ciudad: string;
  cat: string;
  status: (typeof PROVIDER_STATUSES)[number];
  contacto: string;
  tel: string;
  email: string;
  score: number;
  budget: string;
  cobertura: string;
  servicios: string;
  notas: string;
}

const emptyForm: FormState = {
  nombre: "",
  pais: "",
  region: "",
  ciudad: "",
  cat: PROVIDER_CATEGORIES[0],
  status: "Activo",
  contacto: "",
  tel: "",
  email: "",
  score: 3,
  budget: BUDGET_TIERS[1],
  cobertura: COVERAGE_LEVELS[0],
  servicios: "",
  notas: "",
};

export function ProviderFormModal({
  open,
  onClose,
  onSave,
  editing,
  allProviders,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProviderInput) => void;
  editing: Provider | null;
  allProviders: Provider[];
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [paisCustom, setPaisCustom] = useState(false);
  const [regionCustom, setRegionCustom] = useState(false);
  const [ciudadCustom, setCiudadCustom] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever provider was opened for editing
      setForm({
        nombre: editing.nombre,
        pais: editing.pais,
        region: editing.region,
        ciudad: editing.ciudad,
        cat: editing.cat,
        status: editing.status,
        contacto: editing.contacto,
        tel: editing.tel,
        email: editing.email,
        score: editing.score,
        budget: editing.budget,
        cobertura: editing.cobertura,
        servicios: editing.servicios,
        notas: editing.notas,
      });
      setPaisCustom(Boolean(editing.pais) && !GEO[editing.pais]);
      setRegionCustom(Boolean(editing.region) && !!GEO[editing.pais] && !GEO[editing.pais].regions[editing.region]);
      setCiudadCustom(true);
    } else {
      setForm(emptyForm);
      setPaisCustom(false);
      setRegionCustom(false);
      setCiudadCustom(false);
    }
    setErrors({});
  }, [open, editing]);

  const regionOptions = useMemo(
    () => (form.pais && !paisCustom ? regionsForCountry(form.pais, allProviders) : []),
    [form.pais, paisCustom, allProviders],
  );
  const cityOptions = useMemo(
    () => (form.pais && form.region && !regionCustom ? citiesForRegion(form.pais, form.region, allProviders) : []),
    [form.pais, form.region, regionCustom, allProviders],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePaisChange(value: string) {
    if (value === OTRO) {
      setPaisCustom(true);
      set("pais", "");
    } else {
      setPaisCustom(false);
      set("pais", value);
    }
    setRegionCustom(false);
    set("region", "");
    setCiudadCustom(false);
    set("ciudad", "");
  }

  function handleRegionChange(value: string) {
    if (value === OTRO) {
      setRegionCustom(true);
      set("region", "");
    } else {
      setRegionCustom(false);
      set("region", value);
    }
    setCiudadCustom(false);
    set("ciudad", "");
  }

  function handleCiudadSelect(value: string) {
    if (value === OTRO) {
      setCiudadCustom(true);
      set("ciudad", "");
    } else {
      setCiudadCustom(false);
      set("ciudad", value);
    }
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre de la empresa es requerido";
    if (!form.pais.trim()) nextErrors.pais = "Selecciona el país";
    if (!form.cat.trim()) nextErrors.cat = "Selecciona la categoría";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ProviderInput = { ...form };
    onSave(input);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar proveedor" : "Nuevo proveedor"}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar proveedor
          </Button>
        </>
      }
    >
      <Field label="Nombre de la empresa" required error={errors.nombre}>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej. Luces & Escenarios S.A."
        />
      </Field>

      <FieldGroup title={<span className="inline-flex items-center gap-1.5"><MapPin size={12} strokeWidth={2} /> Ubicación</span>}>
        <Row cols={3}>
          <Field label="País" required error={errors.pais}>
            {!paisCustom ? (
              <Select value={form.pais} onChange={(e) => handlePaisChange(e.target.value)}>
                <option value="">Seleccionar…</option>
                {Object.keys(GEO).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={OTRO}>Otro país…</option>
              </Select>
            ) : (
              <>
                <Input
                  autoFocus
                  value={form.pais}
                  onChange={(e) => set("pais", e.target.value)}
                  placeholder="Escribe el nombre del país…"
                  className="border-teal-mid"
                />
                <div className="mt-1 flex items-center gap-1 text-[11px] text-teal">
                  <Check size={12} strokeWidth={2.5} /> Se guardará y aparecerá en los filtros
                </div>
              </>
            )}
          </Field>

          <Field label={regionLabel(form.pais) || "Departamento / Estado"}>
            {!form.pais ? (
              <Select disabled value="">
                <option>— elige país primero —</option>
              </Select>
            ) : !regionCustom ? (
              <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)}>
                <option value="">Seleccionar…</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value={OTRO}>Otro…</option>
              </Select>
            ) : (
              <>
                <Input
                  autoFocus
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Escribe el departamento o estado…"
                  className="border-teal-mid"
                />
                <div className="mt-1 flex items-center gap-1 text-[11px] text-teal">
                  <Check size={12} strokeWidth={2.5} /> Se guardará y aparecerá en los filtros
                </div>
              </>
            )}
          </Field>

          <Field label="Ciudad / Municipio">
            {!form.region ? (
              <Select disabled value="">
                <option>— elige región primero —</option>
              </Select>
            ) : !ciudadCustom ? (
              <Select value={form.ciudad} onChange={(e) => handleCiudadSelect(e.target.value)}>
                <option value="">Seleccionar…</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={OTRO}>Otra…</option>
              </Select>
            ) : (
              <>
                <Input
                  autoFocus
                  value={form.ciudad}
                  onChange={(e) => set("ciudad", e.target.value)}
                  placeholder="Escribe la ciudad o municipio…"
                  className="border-teal-mid"
                />
                <div className="mt-1 flex items-center gap-1 text-[11px] text-teal">
                  <Check size={12} strokeWidth={2.5} /> Se guardará y aparecerá en los filtros
                </div>
              </>
            )}
          </Field>
        </Row>
      </FieldGroup>

      <Row cols={2}>
        <Field label="Categoría" required error={errors.cat}>
          <Select value={form.cat} onChange={(e) => set("cat", e.target.value)}>
            {PROVIDER_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])}>
            {PROVIDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Contacto principal">
          <Input value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre" />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <Input
            type="tel"
            value={form.tel}
            onChange={(e) => set("tel", e.target.value)}
            placeholder="+57 300…"
          />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="contacto@empresa.com"
          />
        </Field>
        <Field label="Score">
          <StarRatingInput value={form.score} onChange={(n) => set("score", n)} />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Presupuesto">
          <Select value={form.budget} onChange={(e) => set("budget", e.target.value)}>
            {BUDGET_TIERS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cobertura">
          <Select value={form.cobertura} onChange={(e) => set("cobertura", e.target.value)}>
            {COVERAGE_LEVELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Field label="Servicios (separados por coma)">
        <Input
          value={form.servicios}
          onChange={(e) => set("servicios", e.target.value)}
          placeholder="video mapping, pantallas LED…"
        />
      </Field>
      <Field label="Notas internas">
        <Textarea
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Historial, condiciones, advertencias…"
        />
      </Field>
    </Modal>
  );
}

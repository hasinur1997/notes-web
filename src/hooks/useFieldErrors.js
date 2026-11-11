"use client";

import { useState } from "react";

/**
 * Decides which field errors to show. Errors are recomputed from the current values on every
 * render; a field's error appears once the user leaves it with something typed, or after a
 * submit attempt, and disappears as soon as the value is fixed. Tabbing through empty fields
 * shows nothing.
 *
 * Inputs need a `name` matching the keys returned by `validate`.
 *
 * @param {Record<string, string>} values - Current form values.
 * @param {(values: Record<string, string>) => Record<string, string | undefined>} validate - Returns a message per invalid field.
 * @returns {{
 *   errors: Record<string, string | undefined>,
 *   handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void,
 *   validateAll: (form: HTMLFormElement) => boolean,
 *   reset: () => void,
 * }} `validateAll` shows every error, focuses the first invalid field and says whether the form is valid.
 */
export function useFieldErrors(values, validate) {
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const all = validate(values);
  const errors = Object.fromEntries(Object.entries(all).map(([field, message]) => [field, submitted || touched[field] ? message : undefined]));

  /** Marks a field as visited once it has a value. */
  function handleBlur(event) {
    const { name, value } = event.target;
    if (value) setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
  }

  /** Shows every error and moves focus to the first invalid field. */
  function validateAll(form) {
    setSubmitted(true);
    const firstInvalid = Object.keys(all).find((field) => all[field]);
    if (firstInvalid) form.elements.namedItem(firstInvalid)?.focus();
    return !firstInvalid;
  }

  /** Forgets visits and submit attempts (e.g. after a successful submit). */
  function reset() {
    setTouched({});
    setSubmitted(false);
  }

  return { errors, handleBlur, validateAll, reset };
}

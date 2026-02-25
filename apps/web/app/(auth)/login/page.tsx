'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { loginAction } from '../../../lib/auth';
import { Toast } from '../../../components/Toast';

const initialState = { error: null as string | null };

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state?.error) setToastMessage(state.error);
  }, [state?.error]);

  return (
    <>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="mx-auto flex w-full max-w-md flex-col justify-center py-16">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to access your library.</p>
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <button className="w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

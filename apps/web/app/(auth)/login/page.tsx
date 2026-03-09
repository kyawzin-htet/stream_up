'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '../../../lib/auth';
import { Toast } from '../../../components/Toast';

const initialState = { error: null as string | null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  );
}

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
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-8">
          <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to access your library.</p>
          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-[#2f2f2f] bg-[#222222] px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
              <input
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-xl border border-[#2f2f2f] bg-[#222222] px-4 py-3 text-sm text-slate-100"
              />
            </div>
            <SubmitButton />
          </form>
        </div>
      </div>
    </>
  );
}

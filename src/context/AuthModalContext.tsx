import React, { createContext, useContext, useState, useCallback } from 'react';
import { AuthModal } from '../components/ui/AuthModal';

interface OpenOptions {
  defaultTab?: 'login' | 'register';
  hint?: string;
  onSuccess?: () => void;
}

interface AuthModalContextType {
  openAuthModal: (options?: OpenOptions) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({});

  const openAuthModal = useCallback((opts: OpenOptions = {}) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setOpen(false);
    setOptions({});
  }, []);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal
        open={open}
        onClose={closeAuthModal}
        onSuccess={() => {
          options.onSuccess?.();
          closeAuthModal();
        }}
        defaultTab={options.defaultTab ?? 'login'}
        hint={options.hint}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}

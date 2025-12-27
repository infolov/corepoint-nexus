import { createContext, useContext, useState, ReactNode } from "react";

interface DemoUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    company_name: string;
    is_advertiser: boolean;
  };
}

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const demoUserData: DemoUser = {
  id: "demo-user-123",
  email: "demo@informacje.pl",
  user_metadata: {
    full_name: "Jan Kowalski",
    company_name: "Demo Firma Sp. z o.o.",
    is_advertiser: true,
  },
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setDemoUser(demoUserData);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoUser(null);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, demoUser, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}

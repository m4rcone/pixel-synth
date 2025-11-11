"use client";

import { createContext, useContext, ReactNode } from "react";

type BreadcrumbContextType = {
  extra?: ReactNode;
};

const BreadcrumbContext = createContext<BreadcrumbContextType>({});

export function BreadcrumbProvider({
  children,
  extra,
}: {
  children?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <BreadcrumbContext.Provider value={{ extra }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

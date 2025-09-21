import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const navTabsVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        outline: "bg-transparent border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const navTabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
  {
    variants: {
      variant: {
        default: "data-[state=active]:bg-background",
        outline: "data-[state=active]:bg-background data-[state=active]:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const navTabsContentVariants = cva(
  "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
)

interface NavTabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant?: VariantProps<typeof navTabsVariants>["variant"]
}

const NavTabsContext = React.createContext<NavTabsContextValue | undefined>(
  undefined
)

interface NavTabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navTabsVariants> {
  value: string
  onValueChange: (value: string) => void
}

const NavTabs = React.forwardRef<HTMLDivElement, NavTabsProps>(
  ({ className, variant, value, onValueChange, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ value, onValueChange, variant }),
      [value, onValueChange, variant]
    )

    return (
      <NavTabsContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(navTabsVariants({ variant, className }))}
          {...props}
        />
      </NavTabsContext.Provider>
    )
  }
)
NavTabs.displayName = "NavTabs"

interface NavTabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navTabsTriggerVariants> {
  value: string
}

const NavTabsTrigger = React.forwardRef<HTMLButtonElement, NavTabsTriggerProps>(
  ({ className, variant, value, ...props }, ref) => {
    const context = React.useContext(NavTabsContext)
    
    if (!context) {
      throw new Error("NavTabsTrigger must be used within NavTabs")
    }

    const isActive = context.value === value

    return (
      <button
        ref={ref}
        className={cn(navTabsTriggerVariants({ variant: variant || context.variant, className }))}
        data-state={isActive ? "active" : "inactive"}
        onClick={() => context.onValueChange(value)}
        {...props}
      />
    )
  }
)
NavTabsTrigger.displayName = "NavTabsTrigger"

interface NavTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const NavTabsContent = React.forwardRef<HTMLDivElement, NavTabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(NavTabsContext)
    
    if (!context) {
      throw new Error("NavTabsContent must be used within NavTabs")
    }

    if (context.value !== value) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(navTabsContentVariants({ className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
NavTabsContent.displayName = "NavTabsContent"

export { NavTabs, NavTabsTrigger, NavTabsContent }

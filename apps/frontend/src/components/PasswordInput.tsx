import { useState, type ComponentProps } from "react"

import { DesignIcon } from "@/components/DesignIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PasswordInput(props: ComponentProps<typeof Input>) {
  const [isVisible, setVisible] = useState(false)
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
        <DesignIcon name="auth-141-1520-IconLock" />
      </span>
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className="pr-14 pl-11"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute inset-y-1 right-1"
        aria-label={isVisible ? "Skrýt heslo" : "Zobrazit heslo"}
        aria-pressed={isVisible}
        disabled={props.disabled}
        onClick={() => setVisible(!isVisible)}
      >
        <DesignIcon name="auth-141-1520-IconEye" />
      </Button>
    </div>
  )
}

<script setup lang="ts">
import { cn } from '../../lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-sm',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
        outline: 'text-foreground border-zinc-200 dark:border-zinc-800',
        success: 'border-transparent bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900',
        warning: 'border-transparent bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props {
  class?: string
  variant?: BadgeVariants['variant']
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant: props.variant }), props.class)">
    <slot />
  </div>
</template>

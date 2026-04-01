import { computed, Directive, inject, Injector, input, signal } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ClassValue } from 'clsx';

export const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      error: {
        auto: '[&.ng-invalid.ng-touched]:border-destructive [&.ng-invalid.ng-touched]:ring-destructive/20 dark:[&.ng-invalid.ng-touched]:ring-destructive/40',
        true: 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
    },
    defaultVariants: {
      error: 'auto',
    },
  },
);
type InputVariants = VariantProps<typeof inputVariants>;

@Directive({
  selector: '[hlmInput]',
})
export class HlmInput {
  private readonly _injector = inject(Injector);
  private readonly _additionalClasses = signal<ClassValue>('');
  private readonly _state = signal<{ error: InputVariants['error'] }>({ error: 'auto' });

  public readonly error = input<InputVariants['error']>('auto');

  protected readonly _computedState = computed(() => ({ error: this.error() }));

  constructor() {
    classes(
      () => [inputVariants({ error: this._state().error }), this._additionalClasses()],
      { injector: this._injector },
    );
  }

  setError(error: InputVariants['error']) {
    this._state.set({ error });
  }

  setClass(cls: ClassValue): void {
    this._additionalClasses.set(cls);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositFormComponent } from './components/deposit-form.component';
import { WithdrawFormComponent } from './components/withdraw-form.component';

@Component({
  selector: 'app-transaction',
  imports: [DepositFormComponent, WithdrawFormComponent],
  template: `
    <section class="flex flex-col relative w-full h-full overflow-hidden bg-transparent">

      <div class="relative z-10 flex-1 flex flex-col no-scrollbar overflow-y-auto">
        @if (isDeposit()) {
          <app-deposit-form
            [currency]="currency()"
            [network]="network()"
          />
        } @else if (isWithdraw()) {
          <app-withdraw-form
            [currency]="currency()"
            [network]="network()"
          />
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div class="liquid-glass-card p-10 border-red-500/20 bg-red-500/5">
              <h2 class="text-xl font-black text-white uppercase tracking-tight mb-2">Transacción Inválida</h2>
              <p class="text-[10px] text-white/40 font-black uppercase tracking-widest leading-relaxed">
                El tipo de operación solicitada no es reconocido por el sistema de seguridad.
              </p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private queryParams = toSignal(this.route.queryParams);

  type = computed(() => this.queryParams()?.['type']);
  currency = computed(() => this.queryParams()?.['currency'] ?? '');
  network = computed(() => this.queryParams()?.['network']);

  isDeposit = computed(() => this.type() === 'depositar');
  isWithdraw = computed(() => this.type() === 'retirar');

  pageTitle = computed(() => this.type() === 'depositar' ? 'Depositar' : 'Retirar');

  goBack(): void {
    this.router.navigate(['/wallet']);
  }
}

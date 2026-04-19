import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-deposit-response-modal',
  templateUrl: './deposit-response-modal.component.html',
  styleUrl: './deposit-response-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositResponseModalComponent {
  responseMessage = input<string>('');
  txnId = input<string>('');
  orderNumber = input<string>('');
  invoiceUrl = input<string>('');
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  rechargeNow() {
    if (this.invoiceUrl()) {
      window.open(this.invoiceUrl(), '_blank');
    }
  }
}
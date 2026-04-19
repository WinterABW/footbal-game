// Basic unit tests for DepositResponseModalComponent
// These tests verify the component's inputs/outputs and basic structure

import { DepositResponseModalComponent } from './deposit-response-modal.component';

describe('DepositResponseModalComponent', () => {
  it('should be defined', () => {
    const component = new DepositResponseModalComponent();
    expect(component).toBeDefined();
  });

  it('should have responseMessage input', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.responseMessage).toBe('function');
  });

  it('should have txnId input', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.txnId).toBe('function');
  });

  it('should have orderNumber input', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.orderNumber).toBe('function');
  });

  it('should have invoiceUrl input', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.invoiceUrl).toBe('function');
  });

  it('should have close output', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.close).toBe('function');
  });

  it('should have onClose method', () => {
    const component = new DepositResponseModalComponent();
    expect(typeof component.onClose).toBe('function');
  });
});

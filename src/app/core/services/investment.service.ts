import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InvestmentService {
  private plans = [
    {
      plan: 1,
      name: 'Casa',
      desc: 'Esta propiedad le genera ingresos gracias al pago por arrendamiento que pagan los inquilinos.',
      investment: 25000,
      total: 37222.5,
      daily: 1488.9,
      hourly: 62.04,
    },
    {
      plan: 2,
      name: 'Pizzería',
      desc: 'Está pizzería está situada en un pueblo muy transcurrido por lo tanto las ventas y las ganancias son mayores.',
      investment: 30000,
      total: 44667,
      daily: 1786.68,
      hourly: 74.44,
    },
    
  ];

  constructor() {}

  getPlanes() {
    return this.plans;
  }
}
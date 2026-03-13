import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardVerticalComponent } from './product-card-vertical.component';

describe('ProductCardVerticalComponent', () => {
    let component: ProductCardVerticalComponent;
    let fixture: ComponentFixture<ProductCardVerticalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProductCardVerticalComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ProductCardVerticalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

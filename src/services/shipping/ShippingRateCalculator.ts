import type { ShippingCalculationParams, ShippingOption } from '../../types/shipping';

export interface ShippingRule {
  minWeight?: number;
  maxWeight?: number;
  baseRate: number;
  perKgRate: number;
  freeShippingThreshold?: number;
}

export class ShippingRateCalculator {
  /**
   * Calculate shipping fee based on weight
   */
  calculateByWeight(weightKg: number, rule: ShippingRule): number {
    if (weightKg <= 0) return rule.baseRate;

    const fee = rule.baseRate + weightKg * rule.perKgRate;
    return Math.max(0, fee);
  }

  /**
   * Check if order qualifies for free shipping
   */
  qualifiesForFreeShipping(orderAmount: number, threshold?: number): boolean {
    if (!threshold) return false;
    return orderAmount >= threshold;
  }

  /**
   * Calculate shipping fee with free shipping check
   */
  calculateFee(
    weightKg: number,
    orderAmount: number,
    rule: ShippingRule
  ): number {
    // Check for free shipping first
    if (this.qualifiesForFreeShipping(orderAmount, rule.freeShippingThreshold)) {
      return 0;
    }

    // Calculate based on weight
    return this.calculateByWeight(weightKg, rule);
  }

  /**
   * Get the cheapest shipping option
   */
  getCheapestOption(options: ShippingOption[]): ShippingOption | null {
    if (options.length === 0) return null;

    return options.reduce((cheapest, current) => {
      return current.fee < cheapest.fee ? current : cheapest;
    });
  }

  /**
   * Get the fastest shipping option
   */
  getFastestOption(options: ShippingOption[]): ShippingOption | null {
    if (options.length === 0) return null;

    return options.reduce((fastest, current) => {
      return current.estimatedDaysMax < fastest.estimatedDaysMax
        ? current
        : fastest;
    });
  }

  /**
   * Filter options by max price
   */
  filterByMaxPrice(options: ShippingOption[], maxPrice: number): ShippingOption[] {
    return options.filter((option) => option.fee <= maxPrice);
  }

  /**
   * Filter options by max delivery days
   */
  filterByMaxDays(options: ShippingOption[], maxDays: number): ShippingOption[] {
    return options.filter((option) => option.estimatedDaysMax <= maxDays);
  }

  /**
   * Sort options by price (ascending)
   */
  sortByPrice(options: ShippingOption[]): ShippingOption[] {
    return [...options].sort((a, b) => a.fee - b.fee);
  }

  /**
   * Sort options by delivery time (ascending)
   */
  sortByDeliveryTime(options: ShippingOption[]): ShippingOption[] {
    return [...options].sort(
      (a, b) => a.estimatedDaysMax - b.estimatedDaysMax
    );
  }

  /**
   * Calculate estimated delivery date
   */
  calculateEstimatedDeliveryDate(daysMin: number, daysMax: number): Date {
    const today = new Date();
    const estimatedDays = Math.ceil((daysMin + daysMax) / 2);
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + estimatedDays);
    return deliveryDate;
  }

  /**
   * Format shipping fee for display
   */
  formatFee(fee: number, currency: string = 'USD'): string {
    if (fee === 0) return 'FREE';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(fee);
  }

  /**
   * Format delivery time range
   */
  formatDeliveryTime(daysMin: number, daysMax: number): string {
    if (daysMin === daysMax) {
      return `${daysMin} ${daysMin === 1 ? 'day' : 'days'}`;
    }
    return `${daysMin}-${daysMax} days`;
  }
}

// Export singleton instance
export const shippingRateCalculator = new ShippingRateCalculator();

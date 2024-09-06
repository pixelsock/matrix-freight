'use client'

import React, { useState } from 'react';
import { Plus, Minus, X, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

type MirrorItem = {
  width: number;
  height: number;
  quantity: number;
};

type Accessorial = 'None' | 'Residential Delivery' | 'Appointment Delivery' | 'Lift-gate Delivery';

const PALLET_SIZES = [
  { maxSize: { width: 26, height: 42 }, maxPerPallet: 15, standardPrice: 200 },
  { maxSize: { width: 36, height: 48 }, maxPerPallet: 12, standardPrice: 200 },
  { maxSize: { width: 36, height: 60 }, maxPerPallet: 10, standardPrice: 300 },
  { maxSize: { width: 42, height: 72 }, maxPerPallet: 8, standardPrice: 350 },
  { maxSize: { width: 42, height: 84 }, maxPerPallet: 5, standardPrice: 450 },
  { maxSize: { width: Infinity, height: Infinity }, maxPerPallet: 3, standardPrice: 850 },
];

const UPS_STATES = {
  standard: ['GA', 'FL', 'AL', 'TN', 'SC', 'NC', 'VA', 'WV', 'KY', 'OH', 'IN', 'MI', 'WI', 'IL', 'MO', 'IA', 'MN', 'NE', 'KS', 'OK', 'TX', 'AR', 'LA', 'MS'],
  adder20: ['NY', 'MA', 'NH', 'VT', 'ME', 'ND', 'SD', 'WY', 'MT', 'ID', 'UT', 'AZ', 'NM'],
  adder40: ['CA', 'NV', 'OR', 'WA'],
};

const PALLET_STATES = {
  standard: ['GA', 'FL', 'AL', 'TN', 'SC', 'NC', 'VA', 'WV', 'KY', 'OH', 'IN', 'MI', 'WI', 'IL', 'MO', 'IA', 'MN', 'NE', 'KS', 'OK', 'TX', 'AR', 'LA', 'MS'],
  adder100: ['NY', 'MA', 'NH', 'VT', 'ME', 'ND', 'SD', 'WY', 'MT', 'ID', 'UT', 'AZ', 'NM'],
  adder150: ['CA', 'NV', 'OR', 'WA'],
};

const US_STATES = [
  'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 
  'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 
  'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function FreightCalculator() {
  const [items, setItems] = useState<MirrorItem[]>([{ width: 0, height: 0, quantity: 0 }]);
  const [state, setState] = useState<string>('');
  const [accessorials, setAccessorials] = useState<Accessorial[]>(['None']);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, { width: 0, height: 0, quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof MirrorItem, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculatePallets = (item: MirrorItem): number => {
    const size = PALLET_SIZES.find(
      (s) => item.width <= s.maxSize.width && item.height <= s.maxSize.height
    );
    return Math.ceil(item.quantity / (size?.maxPerPallet || 1));
  };

  const calculatePrice = () => {
    if (!state) {
      setError('Please select a state.');
      return;
    }

    let price = 0;
    let totalQuantity = 0;
    let oversizedQuantity = 0;

    for (const item of items) {
      totalQuantity += item.quantity;
      if (item.width > 42 || item.height > 84) {
        oversizedQuantity += item.quantity;
      }

      const squareFootage = (item.width * item.height) / 144;
      if (squareFootage <= (26 * 42) / 144 && item.quantity < 5) {
        // UPS Ground
        const basePrice = 60;
        let stateAdder = 0;
        if (UPS_STATES.adder20.includes(state)) {
          stateAdder = 20;
        } else if (UPS_STATES.adder40.includes(state)) {
          stateAdder = 40;
        }
        price += (basePrice + stateAdder) * item.quantity;
      } else {
        // Pallet
        const pallets = calculatePallets(item);
        const size = PALLET_SIZES.find(
          (s) => item.width <= s.maxSize.width && item.height <= s.maxSize.height
        );
        let palletPrice = size?.standardPrice || 200;
        if (PALLET_STATES.adder100.includes(state)) {
          palletPrice += 100;
        } else if (PALLET_STATES.adder150.includes(state)) {
          palletPrice += 150;
        }
        price += palletPrice * pallets;
      }
    }

    // Accessorial pricing
    if (accessorials.includes('Lift-gate Delivery')) price += 25;
    if (accessorials.includes('Residential Delivery')) price += 25;
    if (accessorials.includes('Appointment Delivery')) price += 25;

    // Total mirror quantity exceptions
    if (totalQuantity >= 50 && totalQuantity < 100) {
      price = Math.min(price, 1200);
    } else if (totalQuantity >= 100 && totalQuantity < 150) {
      price = Math.min(price, 1750);
    } else if (totalQuantity >= 150 && totalQuantity < 200) {
      price = Math.min(price, 2000);
    } else if (totalQuantity >= 200 && totalQuantity < 300) {
      price = Math.min(price, 3000);
    } else if (totalQuantity >= 300 && totalQuantity <= 400) {
      price = Math.min(price, 4000);
    }

    if (totalQuantity > 400) {
      setError('Please request a quote for quantities over 400.');
      return;
    }

    if (oversizedQuantity > 25) {
      setError('Please request a quote for oversized mirror sizes/quantities.');
      return;
    }

    setTotalPrice(price);
    setError(null);
  };

  const resetCalculator = () => {
    setItems([{ width: 0, height: 0, quantity: 0 }]);
    setState('');
    setAccessorials(['None']);
    setTotalPrice(0);
    setError(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Freight Calculator</h1>
      
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-end gap-4 pb-4 border-b">
            <div>
              <Label htmlFor={`width-${index}`}>Width (inches)</Label>
              <Input
                id={`width-${index}`}
                type="number"
                value={item.width || ''}
                onChange={(e) => updateItem(index, 'width', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div>
              <Label htmlFor={`height-${index}`}>Height (inches)</Label>
              <Input
                id={`height-${index}`}
                type="number"
                value={item.height || ''}
                onChange={(e) => updateItem(index, 'height', Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div>
              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                value={item.quantity || ''}
                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                className="w-24"
              />
            </div>
            {index > 0 && (
              <Button variant="destructive" size="icon" onClick={() => removeItem(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button onClick={addItem} className="mt-2">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="state">Destination State</Label>
          <Select onValueChange={setState} value={state}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((stateCode) => (
                <SelectItem key={stateCode} value={stateCode}>
                  {stateCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Accessorials</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {(['None', 'Residential Delivery', 'Appointment Delivery', 'Lift-gate Delivery'] as Accessorial[]).map((acc) => (
              <div key={acc} className="flex items-center space-x-2">
                <Checkbox
                  id={acc}
                  checked={accessorials.includes(acc)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      if (acc === 'None') {
                        setAccessorials(['None']);
                      } else {
                        setAccessorials(accessorials.filter(a => a !== 'None').concat(acc));
                      }
                    } else {
                      setAccessorials(accessorials.filter(a => a !== acc));
                    }
                  }}
                />
                <label
                  htmlFor={acc}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {acc}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <Button onClick={calculatePrice}>Calculate</Button>
        <Button variant="outline" onClick={resetCalculator}>Reset</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {totalPrice > 0 && !error && (
        <div className="mt-6 p-4 bg-green-100 rounded-md">
          <h2 className="text-2xl font-bold">Total Price: ${totalPrice.toFixed(2)}</h2>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>White-Glove delivery must be quoted</p>
        <p>Shipments to Alaska, Hawaii, or outside of the US must be quoted.</p>
      </div>
    </div>
  );
}
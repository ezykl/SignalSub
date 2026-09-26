// Predefined Philippine & Global Payment Modes with authentic logos (PNG assets)
export interface PaymentMethodDef {
  key: string;
  name: string;
  shortName: string;
  color: string;
  category: 'e_wallet' | 'bank' | 'card' | 'other';
  paths: string[];
  viewBox: string;
  /** Static require() for the PNG image asset. Undefined means use inline SVG paths. */
  imageSource?: ReturnType<typeof require>;
  /** Background color to use behind the logo image in a container */
  imageBg?: string;
}

export const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    key: 'gcash', name: 'GCash', shortName: 'GCash', color: '#007DFE', imageBg: '#007DFE',
    category: 'e_wallet',
    imageSource: require('../../assets/icons/payment-options/gcash.png'),
    paths: ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c4.14 0 7.7-2.52 9.19-6.13h-3.41c-1.18 1.94-3.32 3.23-5.78 3.23-3.87 0-7-3.13-7-7s3.13-7 7-7c2.46 0 4.6 1.29 5.78 3.23h3.41C19.7 4.52 16.14 2 12 2zm1 6.5v4h4.5v2.5H10.5V8.5H13z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'maya', name: 'Maya', shortName: 'Maya', color: '#00D632', imageBg: '#FFFFFF',
    category: 'e_wallet',
    imageSource: require('../../assets/icons/payment-options/maya.png'),
    paths: ['M18.8 5.4c-1.8 0-3.3 1-4.2 2.4-.9-1.4-2.4-2.4-4.2-2.4-2.8 0-5 2.2-5 5v8.2h3.4V10.4c0-1.1.9-2 2-2s2 .9 2 2v8.2h3.4V10.4c0-1.1.9-2 2-2s2 .9 2 2v8.2h3.4v-8.2c0-2.8-2.2-5-4.8-5z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'gotyme', name: 'GoTyme Bank', shortName: 'GoTyme', color: '#00BDD6', imageBg: '#FFFFFF',
    category: 'bank',
    imageSource: require('../../assets/icons/payment-options/gotyme.png'),
    paths: ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5h4v2.5h-4c-1.1 0-2 .9-2 2s.9 2 2 2h2v-1.5h-1V11h3.5v5.5z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'maribank', name: 'MariBank / SeaBank', shortName: 'MariBank', color: '#FF5722', imageBg: '#FFFFFF',
    category: 'bank',
    imageSource: require('../../assets/icons/payment-options/maribank.png'),
    paths: ['M4 5h3.2l4.8 6.5L16.8 5H20v14h-3.2v-7.8l-4.8 6.5-4.8-6.5V19H4V5z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'unionbank', name: 'UnionBank', shortName: 'UnionBank', color: '#FF6200',
    category: 'bank',
    imageSource: require('../../assets/icons/payment-options/union-bank.png'),
    paths: ['M12 2.5l7.5 4.3v8.6L12 19.8l-7.5-4.4V6.8L12 2.5zm0 3.2L6.8 8.7v5L12 16.7l5.2-3v-5L12 5.7z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'bdo', name: 'BDO Unibank', shortName: 'BDO', color: '#003366', imageBg: '#FFFFFF',
    category: 'bank',
    imageSource: require('../../assets/icons/payment-options/bdo.png'),
    paths: ['M3 6h4.5c2 0 3.5 1.2 3.5 3 0 1.1-.6 2-1.6 2.5 1.3.5 2.1 1.6 2.1 2.9 0 2-1.7 3.6-3.8 3.6H3V6zm3 4.2h1.4c.8 0 1.4-.5 1.4-1.2s-.6-1.2-1.4-1.2H6v2.4zm0 5.4h1.6c.9 0 1.6-.6 1.6-1.4s-.7-1.4-1.6-1.4H6v2.8zm7.5-9.6H17c3.3 0 5.5 2.2 5.5 6s-2.2 6-5.5 6h-3.5V6zm3.2 9.5c1.8 0 2.8-1.4 2.8-3.5s-1-3.5-2.8-3.5h-.7v7h.7z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'bpi', name: 'BPI', shortName: 'BPI', color: '#B21F24', imageBg: '#B21F24',
    category: 'bank',
    imageSource: require('../../assets/icons/payment-options/bpi.png'),
    paths: ['M12 2L4 5.5v6.2c0 5.3 3.4 10.2 8 11.3 4.6-1.1 8-6 8-11.3V5.5L12 2zm-1 15h-2v-6h2v6zm4 0h-2V8h2v9z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'grabpay', name: 'GrabPay', shortName: 'GrabPay', color: '#00B14F', imageBg: '#00B14F',
    category: 'e_wallet',
    imageSource: require('../../assets/icons/payment-options/grab-pay.png'),
    paths: ['M23.129 10.863a2.927 2.927 0 00-2.079-.872c-.57 0-1.141.212-1.455.421-.651.434-1.186.904-2.149 2.148v.894c.817-1.064 1.59-1.903 2.177-2.364.386-.31.933-.501 1.427-.501 1.275 0 2.352 1.077 2.352 2.352v.538c0 .63-.247 1.223-.698 1.668a2.341 2.341 0 01-1.654.685c-1.048 0-1.97-.719-2.22-1.701l-.422.51c.307 1.03 1.417 1.789 2.642 1.789.778 0 1.516-.31 2.079-.872.562-.562.871-1.3.871-2.079v-.538c0-.778-.31-1.517-.871-2.078'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'visa', name: 'Visa', shortName: 'Visa', color: '#1A1F71', imageBg: '#FFFFFF',
    category: 'card',
    imageSource: require('../../assets/icons/payment-options/visa.png'),
    paths: ['M10.539 15.764H8.22L9.73 8.236h2.318l-1.509 7.528zm6.901-7.342a5.713 5.713 0 00-2.073-.38c-2.284 0-3.893 1.214-3.904 2.953-.012 1.283 1.145 2 2.022 2.426.898.437 1.2.715 1.196 1.105-.006.597-.717.87-1.38.87-.923 0-1.414-.136-2.172-.471l-.298-.142-.323 1.996c.538.249 1.531.465 2.563.475 2.419 0 3.994-1.196 4.013-3.046.009-1.014-.604-1.787-1.93-2.422-.804-.413-1.296-.689-1.29-1.106 0-.37.416-.767 1.316-.767.751-.012 1.297.16 1.72.34l.206.103.31-1.934z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'mastercard', name: 'Mastercard', shortName: 'Mastercard', color: '#EB001B', imageBg: '#FFFFFF',
    category: 'card',
    imageSource: require('../../assets/icons/payment-options/mastercard.png'),
    paths: ['M12 17.25a5.25 5.25 0 01-3.248-1.118A5.244 5.244 0 0112 14.976a5.245 5.245 0 013.248 1.156A5.25 5.25 0 0112 17.25z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'card', name: 'Credit / Debit Card', shortName: 'Card', color: '#7B5EA7', imageBg: '#1A1A2E',
    category: 'card',
    paths: ['M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'paypal', name: 'PayPal', shortName: 'PayPal', color: '#003087', imageBg: '#FFFFFF',
    category: 'e_wallet',
    imageSource: require('../../assets/icons/payment-options/paypal.png'),
    paths: ['M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'apple_pay', name: 'Apple Pay', shortName: 'Apple Pay', color: '#FFFFFF', imageBg: '#000000',
    category: 'card',
    imageSource: require('../../assets/icons/payment-options/apple-pay.png'),
    paths: ['M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.98'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'google_pay', name: 'Google Pay', shortName: 'Google Pay', color: '#4285F4', imageBg: '#FFFFFF',
    category: 'card',
    imageSource: require('../../assets/icons/payment-options/google-pay.png'),
    paths: ['M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033z'],
    viewBox: '0 0 24 24',
  },
  {
    key: 'cash_other', name: 'Cash / Other', shortName: 'Other', color: '#64748B',
    category: 'other',
    paths: ['M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z'],
    viewBox: '0 0 24 24',
  },
];

export function getPaymentMethod(key?: string | null): PaymentMethodDef {
  if (!key) return PAYMENT_METHODS[0];
  const found = PAYMENT_METHODS.find(
    (m) => m.key.toLowerCase() === key.toLowerCase() || m.shortName.toLowerCase() === key.toLowerCase()
  );
  return found || PAYMENT_METHODS[0];
}

export interface SavedPaymentMethod {
  id: string;
  methodKey: string;
  details: string;
  isDefault?: boolean;
}

export function parseSavedPaymentMethods(raw?: string | null): SavedPaymentMethod[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

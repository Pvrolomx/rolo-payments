interface PaymentConfig {
  zelle: { email: string };
  venmo: { handle: string };
  wise: { email: string };
  paypal: { email: string };
  wire: {
    bank: string;
    clabe: string;
    swift: string;
    beneficiary: string;
  };
  whatsapp: string;
}

interface Props {
  config: PaymentConfig;
}

export default function PaymentMethods({ config }: Props) {
  const methods = [
    { name: 'Zelle', value: config.zelle.email, icon: '💸' },
    { name: 'Venmo', value: config.venmo.handle, icon: '💰' },
    { name: 'Wise', value: config.wise.email, icon: '🌍' },
    { name: 'PayPal', value: config.paypal.email, icon: '🅿️' },
  ];

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    alert(`${name} info copied to clipboard!`);
  };

  return (
    <div>
      <p className="text-center text-gray-500 text-sm mb-3">Or pay directly:</p>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((method) => (
          <button
            key={method.name}
            onClick={() => copyToClipboard(method.value, method.name)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span>{method.icon}</span>
            <span>{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

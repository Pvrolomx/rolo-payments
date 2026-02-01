interface Service {
  description: string;
  amount: number;
}

interface Props {
  services: Service[];
}

export default function ServiceList({ services }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 font-medium">Services</p>
      {services.map((service, index) => (
        <div key={index} className="flex justify-between items-start">
          <span className="text-gray-700 flex-1 pr-4">• {service.description}</span>
          <span className="text-gray-900 font-medium">${service.amount}</span>
        </div>
      ))}
    </div>
  );
}

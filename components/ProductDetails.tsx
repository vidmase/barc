import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface Product {
  name: string;
  description: string;
  imageUrl: string;
  barcode: string;
}

interface ProductDetailsProps {
  product: Product | null;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  if (!product) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Scan a barcode to see product details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-center">
            <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            width={200}
            height={200}
            className="rounded-md object-cover"
            />
        </div>
        <div>
          <h3 className="font-semibold">Description</h3>
          <p>{product.description}</p>
        </div>
        <div>
            <h3 className="font-semibold">Barcode</h3>
            <p className="font-mono">{product.barcode}</p>
        </div>
      </CardContent>
    </Card>
  );
} 
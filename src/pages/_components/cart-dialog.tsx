import { useState } from "react";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.tsx";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { useCart } from "@/hooks/use-cart.tsx";
import CheckoutDialog from "./checkout-dialog.tsx";

type Product = { name: string; price: number };

const QTY_BTN = "grid size-7 place-items-center rounded-full border bg-background transition-colors hover:bg-secondary";

export default function CartDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, setQty, remove, clear } = useCart();
  // Snapshot the basket at checkout so the success screen still shows it after the basket is cleared.
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  const startCheckout = () => {
    const name = items.map((i) => (i.qty > 1 ? `${i.name} x${i.qty}` : i.name)).join(", ");
    setCheckoutProduct({ name, price: total });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <ShoppingBasket className="size-6 text-primary" /> Your Basket
          </DialogTitle>

          {items.length === 0 ? (
            <Empty className="border-0 bg-transparent p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingBasket />
                </EmptyMedia>
                <EmptyTitle>Your basket is empty</EmptyTitle>
                <EmptyDescription>Add your favourite nail sets from the shop.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <a href="#shop" onClick={onClose} className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105">
                  Browse Nail Sets
                </a>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 rounded-2xl border bg-card/70 p-2.5">
                    <img src={i.img} alt={i.name} className="size-16 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-lg leading-tight">{i.name}</p>
                      <p className="text-sm font-medium text-primary">₹{i.price * i.qty}</p>
                      <div className="flex items-center gap-2 pt-1.5">
                        <button aria-label="Decrease quantity" onClick={() => setQty(i.name, i.qty - 1)} className={QTY_BTN}>
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{i.qty}</span>
                        <button aria-label="Increase quantity" onClick={() => setQty(i.name, i.qty + 1)} className={QTY_BTN}>
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.name)} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-serif text-2xl font-semibold">₹{total}</span>
              </div>
              <button onClick={startCheckout} className="inline-flex h-12 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-[1.02]">
                Checkout
              </button>
              <p className="text-center text-xs text-muted-foreground">Free delivery all over India.</p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {checkoutProduct && <CheckoutDialog product={checkoutProduct} onClose={() => setCheckoutProduct(null)} onSuccess={clear} />}
    </>
  );
}

import React, { useRef, useState } from "react"
import { format } from "date-fns"
import {
    Check, Clipboard, MapPin, Phone, Bike, Package, 
    ArrowLeft, MessageSquare, Info, User, CreditCard, Receipt, Download, Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Order } from "@/types"
import { toPng } from 'html-to-image'

interface OrderBillProps {
    order: Order
}

export const OrderBill: React.FC<OrderBillProps> = ({ order }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!order) return null;

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('PKR', 'Rs')
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(order.orderNumber || order._id)
        toast.success("Order ID copied to clipboard!")
    }

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        
        try {
            setIsDownloading(true);
            toast.loading("Getting Receipt Image...", { id: "pdf-download" });

            const element = receiptRef.current;
            
            // html-to-image handles modern CSS (like oklch) much better than html2canvas
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                pixelRatio: 2 // High Quality
            });

            // Trigger download of the image
            const link = document.createElement('a');
            link.download = `Receipt-${order.orderNumber || order._id.slice(-8)}.png`;
            link.href = dataUrl;
            link.click();
            
            toast.success("Receipt image saved!", { id: "pdf-download" });
        } catch (error) {
            console.error("Image generation failed:", error);
            toast.error("Failed to download receipt", { id: "pdf-download" });
        } finally {
            setIsDownloading(false);
        }
    };

    const orderDate = order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy - h:mm a") : "N/A"
    

    const serviceFee = (order as any).pricing?.serviceFee || 130
    const subtotal = order.pricing?.subtotal || 0
    const deliveryFee = order.pricing?.deliveryFee || 150
    const taxAmount = order.pricing?.tax || 208
    const total = order.pricing?.total || 0

    return (
        <div className="w-full max-w-xl mx-auto">
            {/* Top Action Bar */}
            <div className="mb-4 flex justify-end">
                <Button 
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="rounded-xl border-[#f25e0d] text-[#f25e0d] hover:bg-orange-50 font-bold px-6 h-10 shadow-sm transition-all"
                >
                    {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Receipt
                </Button>
            </div>

            <div ref={receiptRef} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                {/* Reference Header */}
                <div className="bg-[#f25e0d] p-7 text-white">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">ORDER RECEIPT</p>
                        <h1 className="text-2xl font-bold">{(order.restaurant as any)?.name || 'Delicious Food Restaurant'}</h1>
                        <p className="text-sm opacity-90">{orderDate}</p>
                    </div>

                </div>

                <div className="p-7 space-y-6">
                    {/* Customer & Payment Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100/60 p-4 rounded-lg">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-pretty">CUSTOMER</p>
                            <p className="text-sm font-bold text-gray-800">{order.contactInfo?.fullName || "Valued Customer"}</p>
                        </div>
                        <div className="bg-gray-100/60 p-4 rounded-lg">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">PAYMENT</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-800 capitalize">{order.paymentInfo?.method || "Cash"}</p>
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded">Pending</span>
                            </div>
                        </div>
                    </div>

                    {/* Address Block */}
                    <div className="bg-gray-100/60 p-4 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-50">
                            <MapPin className="w-4 h-4 text-[#f25e0d]" />
                        </div>
                        <p className="text-xs font-bold text-gray-600 leading-tight">
                            {order.deliveryAddress?.street || "No Street Specified"}, {order.deliveryAddress?.city || "Gujrat"}
                        </p>
                    </div>

                    {/* Ordered Items */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">ORDERED ITEMS</p>
                        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                            {(order.items || []).map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100/30 flex items-center justify-center border border-orange-100">
                                            <Utensils className="w-5 h-5 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.name || item.menuItem?.name || "Item Name"}</p>
                                            <p className="text-[10px] font-bold text-gray-400">× {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="pt-2 space-y-3 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="text-gray-800 font-bold">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Delivery fee</span>
                            <span className="text-gray-800 font-bold">{formatPrice(deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Service charge</span>
                            <span className="text-gray-800 font-bold">{formatPrice(serviceFee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Tax</span>
                            <span className="text-gray-800 font-bold">{formatPrice(taxAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Total Bar */}
                <div className="bg-[#f25e0d] p-5 flex justify-between items-center">
                    <span className="text-lg font-bold text-white uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-black text-white">{formatPrice(total)}</span>
                </div>

                {/* Receipt ID Footer */}
                <div className="p-5 text-center bg-gray-50/50">
                    <div className="flex items-center justify-center gap-2 opacity-50 cursor-pointer hover:opacity-100 transition-all" onClick={copyToClipboard}>
                        <Receipt className="w-4 h-4" />
                        <span className="text-[9px] font-bold tracking-tighter uppercase font-mono">#{order.orderNumber || order._id}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { Utensils } from "lucide-react"

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />
}

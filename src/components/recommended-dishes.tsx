import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, TrendingUp, Sparkles } from "lucide-react"

import { useState, useEffect } from "react"
import api from "@/services/api"
import { useSelector } from "react-redux"
import { useAppDispatch } from "@/store/hooks"
import { addToCartServer } from "@/store/slices/cartSlice"
import { toast } from "sonner"

export interface RecommendedDish {
    _id: string;
    name: string;
    description: string;
    price: number;
    rating: { average: number; count: number };
    preparationTime: string;
    images: string[];
    isPopular: boolean;
    category: string;
    orderCount: number;
    restaurant: string | { _id: string };
}

export function RecommendedDishes() {
    const { isAuthenticated, user } = useSelector((state: any) => state.auth);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const [dishes, setDishes] = useState<RecommendedDish[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToCartId, setAddingToCartId] = useState<string | null>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Only fetch recommendations if the user is logged in
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/menu/recommendations?limit=4');
                if (response.data.success) {
                    setDishes(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch recommended dishes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [isAuthenticated]);

    const handleAddToCart = async (dish: RecommendedDish) => {
        setAddingToCartId(dish._id);
        try {
            // Need to get restaurantId. In recommended dishes, the restaurant might be an object or ID.
            // Based on the API, it seems to be populated or at least available.
            const restaurantId = typeof dish.restaurant === 'object' ? (dish.restaurant as any)._id : dish.restaurant;
            
            if (!restaurantId) {
                toast.error("Restaurant information missing");
                return;
            }

            await dispatch(addToCartServer({
                menuItemId: dish._id,
                quantity: 1,
                restaurantId: restaurantId
            })).unwrap();

            toast.success(`${dish.name} added to cart!`);
        } catch (error: any) {
            toast.error(error || "Failed to add item to cart");
        } finally {
            setAddingToCartId(null);
        }
    };

    if (!isAuthenticated || isAdmin || (!loading && dishes.length === 0)) {
        return null; // Don't show the section if logged out, admin, or no recommendations
    }

    if (loading) {
        return (
            <section className="py-16 bg-amber-50/50">
                <div className="container mx-auto px-4 text-center">
                    <p>Loading your personalized recommendations...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-amber-50/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-2 bg-amber-100 rounded-full mb-4">
                        <Sparkles className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Recommended For You</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Based on your past orders, we think you'll love these selections.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {dishes.map((dish) => (
                        <Card key={dish._id} className="bg-card border-amber-200 hover:shadow-lg transition-shadow overflow-hidden">
                            <CardContent className="p-0 flex flex-col h-full">
                                <div className="relative">
                                    <img
                                        src={(dish.images && dish.images.length > 0) ? dish.images[0] : "/placeholder.svg"}
                                        alt={dish.name}
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                    <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Recommended
                                    </Badge>
                                </div>

                                <div className="flex-1 p-4 space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-card-foreground line-clamp-1" title={dish.name}>{dish.name}</h3>
                                            <span className="font-bold text-primary whitespace-nowrap">Rs. {dish.price}</span>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2" title={dish.description}>{dish.description}</p>
                                    </div>

                                    <div className="space-y-4 mt-auto">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 text-secondary fill-current" />
                                                <span className="text-muted-foreground truncate max-w-[50%]">{dish.rating?.average?.toFixed(1) || "New"} ({dish.rating?.count || 0})</span>
                                            </div>
                                            <div className="flex items-center space-x-1 shrink-0">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{dish.preparationTime}</span>
                                            </div>
                                        </div>

                                        {dish.orderCount > 0 && (
                                            <div className="flex items-center space-x-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit mt-2">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <span>Ordered {dish.orderCount}+ times</span>
                                            </div>
                                        )}

                                        <Button 
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white mt-3 border-0"
                                            onClick={() => handleAddToCart(dish)}
                                            disabled={addingToCartId === dish._id}
                                        >
                                            {addingToCartId === dish._id ? "Adding..." : "Order Now"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

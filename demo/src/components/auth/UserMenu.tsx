import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Heart, ShoppingBag, Settings, Store } from "lucide-react";
import AuthModal from "./AuthModal";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const { isMerchant, isAdmin } = useUserRole();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("已退出登录");
  };

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAuthModal(true)}
        >
          <User className="h-5 w-5" />
        </Button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/wishlist" className="cursor-pointer">
            <Heart className="h-4 w-4 mr-2" />
            我的收藏
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/orders" className="cursor-pointer">
            <ShoppingBag className="h-4 w-4 mr-2" />
            我的订单
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            账户设置
          </Link>
        </DropdownMenuItem>
        {(isMerchant || isAdmin) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/merchant" className="cursor-pointer">
                <Store className="h-4 w-4 mr-2" />
                商家后台
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

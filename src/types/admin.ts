import type { OrderStatus } from "./order";

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
}

export interface AdminOrderSummary {
  id: string;
  userId: string;
  status: OrderStatus;
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  firstItemThumbnail: string | null;
  firstItemName: string | null;
  addrFullName: string;
  addrCity: string;
  addrState: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  roles: string[];
  createdAt: string;
}

export interface InventoryRow {
  productId: string;
  productName: string;
  productSku: string;
  productThumbnail: string | null;
  variantId: string;
  color: string;
  skuId: string;
  size: string;
  availableQty: number;
  reservedQty: number;
  soldQty: number;
  lowStockThreshold: number;
  inStock: boolean;
}

export interface AdminDataImportError {
  sheet: string;
  row: number;
  message: string;
}

export interface AdminDataImportResult {
  categoriesProcessed: number;
  subCategoriesProcessed: number;
  productsProcessed: number;
  productVariantsProcessed: number;
  productImagesProcessed: number;
  variantSkusProcessed: number;
  errors: AdminDataImportError[];
}

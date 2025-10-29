let allProducts = [] as Product[];

export function useProducts() {
  // Declare the state variables with null to indicate uninitialized state
  const products = useState<Product[] | null>('products', () => null);
  const isProductsLoading = useState<boolean>('isProductsLoading', () => false);

  /**
   * Sets the products state variable and the allProducts variable.
   * @param {Product[]} newProducts - The new products to set.
   */
  function setProducts(newProducts: Product[]): void {
    console.log('📦 [useProducts] setProducts called', { 
      count: Array.isArray(newProducts) ? newProducts.length : 'NOT_ARRAY',
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n')[2]?.trim()
    });
    
    // If newProducts is not an array, reset products and allProducts
    // to empty arrays to avoid errors in the UI.
    if (!Array.isArray(newProducts)) {
      console.warn('⚠️ [useProducts] newProducts is not an array, resetting');
      products.value = [];
      allProducts = [];
      isProductsLoading.value = false;
      return;
    }
    products.value = [...newProducts];
    allProducts = JSON.parse(JSON.stringify(newProducts));
    isProductsLoading.value = false;
    console.log('✅ [useProducts] Products set successfully', { count: newProducts.length });
  }
  
  function setProductsLoading(loading: boolean): void {
    isProductsLoading.value = loading;
  }

  // Named function for product filtering pipeline
  function applyProductFilters(products: Product[]): Product[] {
    const { isSortingActive, sortProducts } = useSorting();
    const { isFiltersActive, filterProducts } = useFiltering();
    const { isSearchActive, searchProducts } = useSearching();

    let newProducts = [...products];
    if (isFiltersActive.value) newProducts = filterProducts(newProducts);
    if (isSearchActive.value) newProducts = searchProducts(newProducts);
    if (isSortingActive.value) newProducts = sortProducts(newProducts);

    return newProducts;
  }

  // Named async function for better performance and debugging
  async function updateProductList(): Promise<void> {
    console.log('🔄 [useProducts] updateProductList called', { 
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n')[2]?.trim()
    });
    
    const { scrollToTop } = useHelpers();
    const { isSortingActive } = useSorting();
    const { isFiltersActive } = useFiltering();
    const { isSearchActive } = useSearching();

    console.log('🔍 [useProducts] Filter states', {
      isSortingActive: isSortingActive.value,
      isFiltersActive: isFiltersActive.value,
      isSearchActive: isSearchActive.value,
      allProductsCount: allProducts.length
    });

    // scroll to top of page
    scrollToTop();

    // return all products if no filters are active
    if (!isFiltersActive.value && !isSearchActive.value && !isSortingActive.value) {
      console.log('✅ [useProducts] No filters active, returning all products');
      products.value = allProducts;
      return;
    }

    // otherwise, apply filter, search and sorting in that order
    try {
      console.log('🔧 [useProducts] Applying filters...');
      products.value = applyProductFilters(allProducts);
      console.log('✅ [useProducts] Filters applied', { resultCount: products.value.length });
    } catch (error) {
      console.error('❌ [useProducts] Error applying filters:', error);
    }
  }

  return { products, allProducts, setProducts, updateProductList, isProductsLoading, setProductsLoading };
}

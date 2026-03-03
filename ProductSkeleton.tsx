export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col h-full animate-pulse">
      {/* Imagen */}
      <div className="aspect-square bg-stone-200" />

      <div className="p-5 flex flex-col flex-grow gap-3">
        {/* Badge categoría */}
        <div className="h-5 w-24 bg-stone-100 rounded-md" />
        {/* Nombre */}
        <div className="h-5 w-full bg-stone-200 rounded-md" />
        <div className="h-5 w-3/4 bg-stone-200 rounded-md" />
        {/* Características */}
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-stone-100 rounded-sm" />
          <div className="h-4 w-20 bg-stone-100 rounded-sm" />
        </div>

        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
          {/* Precio */}
          <div className="h-7 w-20 bg-stone-200 rounded-md" />
          {/* Botón */}
          <div className="h-9 w-24 bg-stone-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

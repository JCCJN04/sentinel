'use client'

import { useState, useCallback } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface CategoryComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  categories: Category[]
  onCreateCategory?: (name: string) => Promise<string>
  placeholder?: string
  disabled?: boolean
}

export function CategoryCombobox({
  value,
  onValueChange,
  categories,
  onCreateCategory,
  placeholder = 'Seleccionar categoría...',
  disabled = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const selectedCategory = categories.find(cat => cat.id === value)
  
  const showCreateOption = 
    searchValue.trim() && 
    !filteredCategories.some(cat => cat.name.toLowerCase() === searchValue.toLowerCase()) &&
    onCreateCategory

  const handleCreate = useCallback(async () => {
    if (!searchValue.trim() || !onCreateCategory) return
    
    setIsCreating(true)
    try {
      const newCategoryId = await onCreateCategory(searchValue.trim())
      onValueChange(newCategoryId)
      setSearchValue('')
      setOpen(false)
    } finally {
      setIsCreating(false)
    }
  }, [searchValue, onCreateCategory, onValueChange])

  const handleSelect = useCallback((categoryId: string) => {
    onValueChange(categoryId)
    setSearchValue('')
    setOpen(false)
  }, [onValueChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedCategory?.name || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col">
          <Input
            placeholder="Buscar o crear categoría..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="border-0 border-b rounded-none"
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length === 0 && !showCreateOption ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Sin categorías disponibles
              </div>
            ) : (
              <>
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelect(category.id)}
                    className={cn(
                      'w-full px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between',
                      value === category.id && 'bg-accent'
                    )}
                  >
                    <span>{category.name}</span>
                    {value === category.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
                {showCreateOption && (
                  <>
                    <div className="my-1 border-t" />
                    <button
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      <span>
                        {isCreating 
                          ? 'Creando...' 
                          : `Crear "${searchValue}"`
                        }
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

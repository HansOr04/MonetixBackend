export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
  userId?: string | null;
  isDefault?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
}

export interface CategoryFilter {
  type?: 'income' | 'expense';
  isDefault?: boolean;
  search?: string;
}

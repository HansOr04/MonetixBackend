export interface CreateTransactionDTO {
  userId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  date?: Date;
}

export interface UpdateTransactionDTO {
  categoryId?: string;
  amount?: number;
  type?: 'income' | 'expense';
  description?: string;
  date?: Date;
}

export interface TransactionFilter {
  type?: 'income' | 'expense';
  categoryId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryAggregation {
  categoryId: string;
  categoryName: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  total: number;
  count: number;
  average: number;
}

export interface PeriodAggregation {
  period: string;
  type: 'income' | 'expense';
  total: number;
  count: number;
}

export interface TransactionStatistics {
  income: {
    total: number;
    count: number;
    average: number;
  };
  expense: {
    total: number;
    count: number;
    average: number;
  };
  balance: number;
  totalTransactions: number;
}

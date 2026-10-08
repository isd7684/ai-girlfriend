import type {
  CreateFinancialBillRequest,
  CreateFinancialBillResponse,
  DeleteFinancialBillRequest,
  DeleteFinancialBillResponse,
  FinancialBillListResponse,
  UpdateFinancialBillRequest,
  UpdateFinancialBillResponse,
} from '@repo/contracts'
import { http } from '@/lib/http'

export function getFinancialBills(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : ''
  return http.get<FinancialBillListResponse>(`/rpc/financial/bill/list${query}`)
}

export function createFinancialBill(input: CreateFinancialBillRequest) {
  return http.post<CreateFinancialBillResponse, CreateFinancialBillRequest>('/rpc/financial/bill/create', input)
}

export function updateFinancialBill(input: UpdateFinancialBillRequest) {
  return http.post<UpdateFinancialBillResponse, UpdateFinancialBillRequest>('/rpc/financial/bill/update', input)
}

export function deleteFinancialBill(input: DeleteFinancialBillRequest) {
  return http.post<DeleteFinancialBillResponse, DeleteFinancialBillRequest>('/rpc/financial/bill/delete', input)
}

import { uuidv7 } from 'uuidv7'
import { Hono, type Context } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  BizCode,
  CreateFinancialBillRequestSchema,
  CreateFinancialBillResponseSchema,
  DeleteFinancialBillRequestSchema,
  DeleteFinancialBillResponseSchema,
  FinancialBillListQuerySchema,
  FinancialBillListResponseSchema,
  UpdateFinancialBillRequestSchema,
  UpdateFinancialBillResponseSchema,
  buildSuccess,
} from '@repo/contracts'
import { authUnauthorizedError } from '@/auth/errors'
import { buildValidationErrorHandler } from '@/auth/http'
import { verifyAccessToken } from '@/auth/jwt'
import { normalizeEmail } from '@/auth/request-context'
import {
  createFinancialBill,
  deleteFinancialBill,
  findFinancialBillById,
  listFinancialBillMonths,
  listFinancialBillsByMonth,
  updateFinancialBill,
} from '@/auth/repository'
import type { ApiBindings } from '@/bindings'
import { getDb } from '@/db/client'
import { getApiEnv } from '@/env'
import { createApiMeta } from '@/lib/api-meta'
import { AppError } from '@/lib/app-error'

const financialBillRoute = new Hono<{ Bindings: ApiBindings }>()

async function requireAdminOwner(c: Context<{ Bindings: ApiBindings }>) {
  const authorization = c.req.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    throw authUnauthorizedError('Access token is required')
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    throw authUnauthorizedError('Access token is required')
  }

  const env = getApiEnv(c.env)

  try {
    const claims = await verifyAccessToken({
      token,
      secret: env.JWT_ACCESS_SECRET,
    })

    if (!claims.roles.includes('admin_owner')) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Admin owner role required', 403)
    }

    return claims
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw authUnauthorizedError('Access token is invalid')
  }
}

financialBillRoute.get('/list', async (c) => {
  await requireAdminOwner(c)

  const query = FinancialBillListQuerySchema.parse({
    month: c.req.query('month'),
  })
  const db = getDb(c.env.DB)
  let months: Awaited<ReturnType<typeof listFinancialBillMonths>>
  let items: Awaited<ReturnType<typeof listFinancialBillsByMonth>> = []

  try {
    months = await listFinancialBillMonths(db)
    const selectedMonth = query.month ?? months[0]?.month ?? null
    items = selectedMonth ? await listFinancialBillsByMonth(db, selectedMonth) : []
  } catch (error) {
    if (isFinancialBillsTableMissingError(error)) {
      throw new AppError(
        BizCode.SYSTEM_INTERNAL_ERROR,
        'Financial bill table is missing. Please apply the latest D1 migration first.',
        500,
      )
    }

    throw error
  }

  const selectedMonth = query.month ?? months[0]?.month ?? null
  const totalPaidAmountCents = items.reduce((total, item) => total + item.paidAmountCents, 0)
  const totalRefundAmountCents = items.reduce((total, item) => total + item.refundAmountCents, 0)
  const totalNetRevenueCents = items.reduce((total, item) => total + item.netRevenueCents, 0)
  const res = FinancialBillListResponseSchema.parse({
    selectedMonth,
    months,
    items,
    totalPaidAmountCents,
    totalRefundAmountCents,
    totalNetRevenueCents,
  })

  return c.json(buildSuccess(res, createApiMeta()))
})

financialBillRoute.post(
  '/create',
  zValidator('json', CreateFinancialBillRequestSchema, buildValidationErrorHandler('Invalid financial bill create payload')),
  async (c) => {
    const claims = await requireAdminOwner(c)
    const payload = c.req.valid('json')
    const billId = uuidv7()
    const nowMs = Date.now()

    await createFinancialBill({
      db: getDb(c.env.DB),
      id: billId,
      wechatNickname: payload.wechatNickname,
      email: payload.email,
      normalizedEmail: normalizeEmail(payload.email),
      paidAmountCents: payload.paidAmountCents,
      paidAtMs: payload.paidAtMs,
      billingMonth: payload.billingMonth,
      isRefunded: payload.isRefunded,
      refundAmountCents: payload.refundAmountCents,
      note: payload.note || null,
      createdByUserId: claims.sub,
      nowMs,
    })

    const res = CreateFinancialBillResponseSchema.parse({
      id: billId,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

financialBillRoute.post(
  '/update',
  zValidator('json', UpdateFinancialBillRequestSchema, buildValidationErrorHandler('Invalid financial bill update payload')),
  async (c) => {
    await requireAdminOwner(c)
    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const existingBill = await findFinancialBillById(db, payload.billId)

    if (!existingBill) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'Financial bill is not found', 404)
    }

    await updateFinancialBill({
      db,
      billId: payload.billId,
      wechatNickname: payload.wechatNickname,
      email: payload.email,
      normalizedEmail: normalizeEmail(payload.email),
      paidAmountCents: payload.paidAmountCents,
      paidAtMs: payload.paidAtMs,
      billingMonth: payload.billingMonth,
      isRefunded: payload.isRefunded,
      refundAmountCents: payload.refundAmountCents,
      note: payload.note || null,
      nowMs: Date.now(),
    })

    const res = UpdateFinancialBillResponseSchema.parse({
      success: true,
      id: payload.billId,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

financialBillRoute.post(
  '/delete',
  zValidator('json', DeleteFinancialBillRequestSchema, buildValidationErrorHandler('Invalid financial bill delete payload')),
  async (c) => {
    await requireAdminOwner(c)
    const payload = c.req.valid('json')
    const db = getDb(c.env.DB)
    const existingBill = await findFinancialBillById(db, payload.billId)

    if (!existingBill) {
      throw new AppError(BizCode.COMMON_NOT_FOUND, 'Financial bill is not found', 404)
    }

    await deleteFinancialBill({
      db,
      billId: payload.billId,
    })

    const res = DeleteFinancialBillResponseSchema.parse({
      success: true,
      id: payload.billId,
    })

    return c.json(buildSuccess(res, createApiMeta()))
  },
)

function isFinancialBillsTableMissingError(error: unknown) {
  return error instanceof Error
    && error.message.toLowerCase().includes('financial_bills')
    && error.message.toLowerCase().includes('no such table')
}

export default financialBillRoute

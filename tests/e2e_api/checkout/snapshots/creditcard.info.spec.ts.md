# Snapshot report for `tests/e2e_api/checkout/creditcard.info.spec.ts`

The actual snapshot is saved in `creditcard.info.spec.ts.snap`.

Generated by [AVA](https://ava.li).

## Get 200 success code when deleting creditcard (skip-prod)

> Snapshot 1

    true

## Get 401 error code when accessing creditcard info with invalid cookie

> Snapshot 1

    {
      error: true,
      message: 'Access denied.',
    }

## Get 500 error code when deleting invalid creditcard

> Snapshot 1

    {
      code: 500,
      message: 'INVALID_CREDIT_CARD_OR_CANNOT_DELETE',
    }
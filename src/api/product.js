import request from '@/utils/request'

export function getProductList() {
  return request({
    url: '/api/products/list',
    method: 'get'
  })
}

export function toggleFavorite(productId, action) {
  return request({
    url: `/api/products/${productId}/favorite`,
    method: 'post',
    data: { action }
  })
}

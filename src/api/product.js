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

export function createProduct(data) {
  return request({
    url: '/api/products',
    method: 'post',
    data
  })
}

export function updateProduct(id, data) {
  return request({
    url: `/api/products/${id}`,
    method: 'put',
    data
  })
}

export function initProductFolders(id) {
  return request({
    url: `/api/products/${id}/init-folders`,
    method: 'post'
  })
}

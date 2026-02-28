import request from '@/utils/request'

export function getProductList() {
  return request({
    url: '/busi-product/list',
    method: 'get'
  })
}

export function getProduct(id) {
  return request({
    url: `/busi-product/${id}`,
    method: 'get'
  })
}

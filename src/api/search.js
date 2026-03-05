import request from '@/utils/request'

export function search(params) {
  return request({
    url: '/api/search',
    method: 'get',
    params
  })
}

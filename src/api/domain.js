import request from '@/utils/request'

export function getDomainList() {
  return request({
    url: '/sys-domain/list',
    method: 'get'
  })
}

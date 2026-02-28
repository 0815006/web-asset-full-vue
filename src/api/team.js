import request from '@/utils/request'

export function getTeamList() {
  return request({
    url: '/sys-team/list',
    method: 'get'
  })
}

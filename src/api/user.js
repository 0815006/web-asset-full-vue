import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return Promise.resolve({
    data: {
      name: '陈东',
      avatar: ''
    }
  })
}

export function logout() {
  return Promise.resolve()
}

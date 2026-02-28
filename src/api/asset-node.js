import request from '@/utils/request'

export function getAssetNodeList() {
  return request({
    url: '/asset-node/list',
    method: 'get'
  })
}

export function saveAssetNode(data) {
  return request({
    url: '/asset-node/save',
    method: 'post',
    data
  })
}

export function updateAssetNode(data) {
  return request({
    url: '/asset-node/update',
    method: 'put',
    data
  })
}

export function deleteAssetNode(id) {
  return request({
    url: `/asset-node/delete/${id}`,
    method: 'delete'
  })
}

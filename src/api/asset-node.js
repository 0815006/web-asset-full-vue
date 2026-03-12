import request from '@/utils/request'

export function getAssetTree(params) {
  return request({
    url: '/api/assets/tree',
    method: 'get',
    params
  })
}

export function createFolder(data) {
  return request({
    url: '/api/assets/folder',
    method: 'post',
    data
  })
}

export function renameAsset(id, newName) {
  return request({
    url: `/api/assets/${id}/rename`,
    method: 'put',
    data: { new_name: newName }
  })
}

export function moveAsset(id, targetParentId) {
  return request({
    url: `/api/assets/${id}/move`,
    method: 'put',
    data: { target_parent_id: targetParentId }
  })
}

export function deleteAsset(id) {
  return request({
    url: `/api/assets/${id}`,
    method: 'delete'
  })
}

export function acquireLock(id) {
  return request({
    url: `/api/assets/${id}/lock`,
    method: 'post'
  })
}

export function keepAliveLock(id, lockId) {
  return request({
    url: `/api/assets/${id}/lock/keepalive`,
    method: 'put',
    data: { lock_id: lockId }
  })
}

export function unlockAsset(id, lockId) {
  return request({
    url: `/api/assets/${id}/unlock`,
    method: 'post',
    data: { lock_id: lockId }
  })
}

export function uploadFile(data) {
  return request({
    url: '/api/assets/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateAsset(id, data) {
  return request({
    url: `/api/assets/${id}/update`,
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function downloadAssets(data) {
  return request({
    url: '/api/assets/download',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

export function getAssetDetails(id) {
  return request({
    url: `/api/assets/${id}/details`,
    method: 'get'
  })
}

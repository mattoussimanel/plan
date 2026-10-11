import { download } from './download.js'

describe('download', () => {
  it('crée un lien temporaire avec le nom du fichier et le clique', () => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { this.dataset.name = this.download })
    download('a.txt', 'salut', 'text/plain')
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(click).toHaveBeenCalled()
    vi.advanceTimersByTime(1001)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })
})

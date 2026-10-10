import { useId, useState, type FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'

const industries = ['政府', '工业机器人', 'AGV机器人', 'AMR机器人', '具身智能', '上游供应商', '下游产业', '其他']

export default function SiteContactForm({ id }: { id?: string }) {
  const formId = useId()
  const [status, setStatus] = useState('')

  const clearStatus = (event: FormEvent<HTMLFormElement>) => {
    setStatus('')
    const field = event.target
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.setCustomValidity('')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    for (const fieldName of ['name', 'contact', 'needs']) {
      const field = form.elements.namedItem(fieldName)
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.setCustomValidity(field.value.trim() ? '' : '请填写此项。')
      }
    }
    if (!form.reportValidity()) return
    // The study has no collection endpoint; do not transmit or claim receipt.
    setStatus('当前为页面预览，信息尚未发送。')
  }

  return <form id={id} className="site-contact-form" aria-label="合作需求表单" onSubmit={handleSubmit} onInput={clearStatus}>
    <div className="site-contact-fields">
      <div className="site-contact-field">
        <label htmlFor={`${formId}-name`}>姓名 <span className="site-contact-required" aria-hidden="true">*</span></label>
        <input id={`${formId}-name`} name="name" autoComplete="name" maxLength={80} required />
      </div>
      <div className="site-contact-field">
        <label htmlFor={`${formId}-contact`}>电话 / 邮箱 <span className="site-contact-required" aria-hidden="true">*</span></label>
        <input id={`${formId}-contact`} name="contact" type="text" autoComplete="email" maxLength={160} required />
      </div>
      <div className="site-contact-field">
        <label htmlFor={`${formId}-company`}>公司 / 组织 <span className="site-contact-optional">选填</span></label>
        <input id={`${formId}-company`} name="company" autoComplete="organization" maxLength={160} />
      </div>
      <div className="site-contact-field">
        <label htmlFor={`${formId}-industry`}>所属行业 <span className="site-contact-optional">选填</span></label>
        <select id={`${formId}-industry`} name="industry" defaultValue="">
          <option value="">请选择</option>
          {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
        </select>
      </div>
      <div className="site-contact-field site-contact-field--wide">
        <label htmlFor={`${formId}-needs`}>需求 <span className="site-contact-required" aria-hidden="true">*</span></label>
        <textarea id={`${formId}-needs`} name="needs" rows={2} placeholder="训练目标、数据需求或合作方向" maxLength={2000} required />
      </div>
    </div>
    <div className="site-contact-actions">
      <label className="site-contact-consent" htmlFor={`${formId}-privacy`}>
        <input id={`${formId}-privacy`} name="privacy" type="checkbox" required />
        <span>我同意接收来自刻行的通信，并且根据<a href="https://www.coscene.cn/privacy-policy" target="_blank" rel="noopener noreferrer">隐私政策</a>处理我的个人信息</span>
      </label>
      <button className="site-contact-submit" type="submit">提交需求 <span className="site-contact-submit-symbol" aria-hidden="true"><ArrowUpRight size={16} strokeWidth={2} /></span></button>
    </div>
    <p className="site-contact-status" role="status" aria-live="polite">{status}</p>
  </form>
}

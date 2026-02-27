import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useForm } from '@formspree/react'
import {
    MessageSquare,
    Bug,
    Lightbulb,
    AlertTriangle,
    Send,
    Github,
    Mail,
    ExternalLink
} from 'lucide-react'

interface FeedbackForm {
    type: 'bug' | 'feature' | 'question' | 'other'
    title: string
    description: string
    email: string
    submitMethod: 'github' | 'email'
}

const FeedbackPage: React.FC = () => {
    const [form, setForm] = useState<FeedbackForm>({
        type: 'bug',
        title: '',
        description: '',
        email: '',
        submitMethod: 'github'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Formspree hook - 使用你的 Formspree form ID
    const [state, handleFormspreeSubmit] = useForm("xojnrgzl")

    const feedbackTypes = [
        { value: 'bug', label: '错误报告', icon: Bug, color: 'text-error' },
        { value: 'feature', label: '功能建议', icon: Lightbulb, color: 'text-warning' },
        { value: 'question', label: '使用问题', icon: MessageSquare, color: 'text-info' },
        { value: 'other', label: '其他反馈', icon: AlertTriangle, color: 'text-neutral' }
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.title.trim() || !form.description.trim()) {
            toast.error('请填写标题和详细描述')
            return
        }

        setIsSubmitting(true)

        try {
            if (form.submitMethod === 'github') {
                await submitToGitHub()
            } else {
                await submitByEmail()
            }
        } catch (error) {
            console.error('Submit failed:', error)
            toast.error('提交失败，请稍后重试')
        } finally {
            setIsSubmitting(false)
        }
    }

    const submitToGitHub = async () => {
        const typeLabels = {
            bug: 'bug',
            feature: 'enhancement',
            question: 'question',
            other: 'feedback'
        }

        const issueBody = `
## 问题类型
${feedbackTypes.find(t => t.value === form.type)?.label}

## 详细描述
${form.description}

${form.email ? `\n## 联系方式\n${form.email}` : ''}

---
*此问题通过协议解析器应用提交*
        `.trim()

        const githubToken = import.meta.env.VITE_GITHUB_TOKEN

        try {
            const response = await fetch('https://api.github.com/repos/zerojacks/embed/issues', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: form.title,
                    body: issueBody,
                    labels: [typeLabels[form.type]]
                })
            })

            if (response.ok) {
                const issue = await response.json()
                toast.success(`Issue 已成功创建！#${issue.number}`)

                // 清空表单
                setForm({
                    type: 'bug',
                    title: '',
                    description: '',
                    email: '',
                    submitMethod: 'github'
                })
            } else {
                const error = await response.json()
                throw new Error(error.message || '创建 Issue 失败')
            }
        } catch (error) {
            console.error('GitHub API Error:', error)
            toast.error(`提交失败: ${error instanceof Error ? error.message : '未知错误'}`)
            throw error
        }
    }

    const submitByEmail = async () => {
        const typeLabels = {
            bug: '错误报告',
            feature: '功能建议',
            question: '使用问题',
            other: '其他反馈'
        }

        const currentTime = new Date().toLocaleString('zh-CN')
        const browserInfo = `${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.match(/Chrome\/[\d.]+|Firefox\/[\d.]+|Safari\/[\d.]+|Edge\/[\d.]+/)?.[0] || ''}`

        // 使用 FormData 构建内容
        const formData = new FormData()
        formData.append('反馈类型', typeLabels[form.type])
        formData.append('反馈标题', form.title)
        formData.append('详细描述', form.description)
        formData.append('联系方式', form.email || '未提供')
        formData.append('提交时间', currentTime)
        formData.append('浏览器信息', browserInfo)
        formData.append('应用来源', '协议解析器应用')

        await handleFormspreeSubmit(formData)

        if (state.succeeded) {
            toast.success('邮件已成功发送！')
            // 清空表单
            setForm({
                type: 'bug',
                title: '',
                description: '',
                email: '',
                submitMethod: 'email'
            })
        } else if (state.errors && Object.keys(state.errors).length > 0) {
            toast.error('邮件发送失败，请稍后重试')
        }
    }



    return (
        <div className="h-full overflow-auto bg-base-200/30">
            <div className="min-h-full flex items-center justify-center p-4 py-8">
                <div className="w-full max-w-3xl">
                    {/* 页面标题区域 */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-base-content mb-2">问题反馈</h1>
                        <p className="text-base-content/70 text-lg">
                            遇到问题或有建议？我们很乐意听到您的反馈！
                        </p>
                    </div>

                    {/* 主要内容卡片 */}
                    <div className="card bg-base-100 shadow-xl border border-base-300">
                        <div className="card-body p-8">

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* 反馈类型 */}
                                <div className="form-control">
                                    <label className="label mb-3">
                                        <span className="label-text text-lg font-semibold">反馈类型</span>
                                    </label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {feedbackTypes.map((type) => {
                                            const Icon = type.icon
                                            return (
                                                <label key={type.value} className="cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value={type.value}
                                                        checked={form.type === type.value}
                                                        onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                                                        className="sr-only"
                                                    />
                                                    <div className={`card bg-base-200 hover:bg-base-300 hover:shadow-md transition-all duration-200 group-hover:scale-105 ${form.type === type.value
                                                        ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                                                        : 'hover:ring-1 hover:ring-base-300'
                                                        }`}>
                                                        <div className="card-body p-6 text-center">
                                                            <Icon className={`w-8 h-8 mx-auto mb-3 ${form.type === type.value ? 'text-primary' : type.color
                                                                }`} />
                                                            <span className="text-sm font-medium">{type.label}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* 标题 */}
                                <div className="form-control">
                                    <label className="label mb-2">
                                        <span className="label-text text-lg font-semibold">标题 <span className="text-error">*</span></span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="简要描述您的问题或建议"
                                        className="input input-bordered input-lg w-full focus:input-primary"
                                        value={form.title}
                                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* 详细描述 */}
                                <div className="form-control">
                                    <label className="label mb-2">
                                        <span className="label-text text-lg font-semibold">详细描述 <span className="text-error">*</span></span>
                                    </label>
                                    <textarea
                                        placeholder={`请详细描述您遇到的问题、期望的功能或其他反馈...\n\n如果是错误报告，请包含：\n• 操作步骤\n• 预期结果\n• 实际结果\n• 浏览器版本等环境信息`}
                                        className="textarea textarea-bordered textarea-lg h-40 w-full resize-none focus:textarea-primary"
                                        value={form.description}
                                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* 联系方式 */}
                                <div className="form-control">
                                    <label className="label mb-2">
                                        <span className="label-text text-lg font-semibold">联系方式（可选）</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="您的邮箱地址，方便我们回复"
                                        className="input input-bordered input-lg w-full focus:input-primary"
                                        value={form.email}
                                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>

                                {/* 提交方式 */}
                                <div className="form-control">
                                    <label className="label mb-3">
                                        <span className="label-text text-lg font-semibold">提交方式</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="submitMethod"
                                                value="github"
                                                checked={form.submitMethod === 'github'}
                                                onChange={(e) => setForm(prev => ({ ...prev, submitMethod: e.target.value as any }))}
                                                className="sr-only"
                                            />
                                            <div className={`card bg-base-200 hover:bg-base-300 transition-all duration-200 group-hover:scale-105 ${form.submitMethod === 'github'
                                                ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                                                : 'hover:ring-1 hover:ring-base-300'
                                                }`}>
                                                <div className="card-body p-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Github className={`w-6 h-6 ${form.submitMethod === 'github' ? 'text-primary' : 'text-base-content'
                                                            }`} />
                                                        <span className="font-semibold">GitHub Issues</span>
                                                        <ExternalLink className="w-4 h-4 text-base-content/60" />
                                                    </div>
                                                    <p className="text-sm text-base-content/70 mb-3">
                                                        公开透明，便于跟踪处理进度，适合错误报告和功能建议
                                                    </p>


                                                </div>
                                            </div>
                                        </label>
                                        <label className="cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="submitMethod"
                                                value="email"
                                                checked={form.submitMethod === 'email'}
                                                onChange={(e) => setForm(prev => ({ ...prev, submitMethod: e.target.value as any }))}
                                                className="sr-only"
                                            />
                                            <div className={`card bg-base-200 hover:bg-base-300 transition-all duration-200 group-hover:scale-105 ${form.submitMethod === 'email'
                                                ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                                                : 'hover:ring-1 hover:ring-base-300'
                                                }`}>
                                                <div className="card-body p-6">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Mail className={`w-6 h-6 ${form.submitMethod === 'email' ? 'text-primary' : 'text-base-content'
                                                            }`} />
                                                        <span className="font-semibold">邮件发送</span>
                                                    </div>
                                                    <p className="text-sm text-base-content/70">
                                                        私密沟通，直接联系，适合敏感问题或需要详细讨论的情况
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* 提交按钮 */}
                                <div className="form-control pt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-full md:w-auto md:self-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-md"></span>
                                                提交中...
                                            </>
                                        ) : (
                                            <>
                                                {form.submitMethod === 'github' ? (
                                                    <>
                                                        <Github className="w-5 h-5" />
                                                        <ExternalLink className="w-4 h-4" />
                                                        提交到 GitHub Issues
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        发送邮件反馈
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* 说明信息 */}
                            <div className="divider my-8"></div>
                            <div className="bg-base-200/50 rounded-lg p-6">
                                <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-info" />
                                    提交说明
                                </h3>
                                <div className="space-y-3 text-sm text-base-content/80">
                                    <div className="flex gap-3">
                                        <Github className="w-4 h-4 mt-0.5 text-base-content/60 flex-shrink-0" />
                                        <div>
                                            <strong>GitHub Issues：</strong>
                                            <span>适合错误报告和功能建议，所有用户都能看到，便于跟踪处理进度和讨论</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Mail className="w-4 h-4 mt-0.5 text-base-content/60 flex-shrink-0" />
                                        <div>
                                            <strong>邮件反馈：</strong>
                                            <span>适合私密问题或需要直接沟通的情况，我们会尽快回复</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-base-300">
                                        <p className="text-center text-base-content/60">
                                            感谢您的反馈，这将帮助我们不断改进产品！
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    )
}

export default FeedbackPage
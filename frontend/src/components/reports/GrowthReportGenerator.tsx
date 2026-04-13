import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// 宝宝信息
interface ChildInfo {
  name: string
  birthDate: string
  gender?: string
  currentAge?: string
}

// 成长记录
interface GrowthRecord {
  recordDate: string
  height?: number | null
  weight?: number | null
  headCircumference?: number | null
  notes?: string | null
}

// 里程碑
interface Milestone {
  name: string
  category: string
  achievedDate?: string
  typicalMonth?: number
}

// PDF样式 - 使用元组类型
const COLORS = {
  primary: [220, 120, 80] as [number, number, number],
  secondary: [120, 180, 160] as [number, number, number],
  accent: [180, 140, 100] as [number, number, number],
  text: [60, 60, 60] as [number, number, number],
  lightText: [120, 120, 120] as [number, number, number],
  background: [255, 250, 245] as [number, number, number],
}

export function generateGrowthReportPDF(
  child: ChildInfo,
  growthRecords: GrowthRecord[],
  milestones: Milestone[],
  options?: {
    title?: string
    includeGrowthTable?: boolean
    includeMilestones?: boolean
  },
): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20

  // 计算宝宝当前月龄
  const birthDate = new Date(child.birthDate)
  const now = new Date()
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth())
  const days = Math.floor(
    (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
  )
  const ageDisplay =
    months >= 12
      ? `${Math.floor(months / 12)}岁${months % 12}个月`
      : `${months}个月${days % 30}天`

  // ===== 封面页 =====
  // 背景色
  const [bgR, bgG, bgB] = COLORS.background
  pdf.setFillColor(bgR, bgG, bgB)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  // 顶部装饰条
  const [pR, pG, pB] = COLORS.primary
  pdf.setFillColor(pR, pG, pB)
  pdf.rect(0, 0, pageWidth, 8, 'F')

  // 标题
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  const [tR, tG, tB] = COLORS.text
  pdf.setTextColor(tR, tG, tB)
  pdf.text('宝宝成长报告', pageWidth / 2, 50, { align: 'center' })

  // 宝宝名字
  pdf.setFontSize(22)
  pdf.setTextColor(pR, pG, pB)
  pdf.text(child.name, pageWidth / 2, 70, { align: 'center' })

  // 装饰线
  const [sR, sG, sB] = COLORS.secondary
  pdf.setDrawColor(sR, sG, sB)
  pdf.setLineWidth(0.5)
  pdf.line(margin + 30, 80, pageWidth - margin - 30, 80)

  // 宝宝信息卡片
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(margin, 95, pageWidth - margin * 2, 50, 3, 3, 'F')

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  pdf.setTextColor(tR, tG, tB)

  const infoY = 110
  const infoStartX = margin + 15

  pdf.text(`出生日期：${child.birthDate}`, infoStartX, infoY)
  pdf.text(`当前月龄：${ageDisplay}`, infoStartX, infoY + 10)
  if (child.gender) {
    pdf.text(
      `性别：${child.gender === 'male' ? '男' : child.gender === 'female' ? '女' : child.gender}`,
      infoStartX + 70,
      infoY,
    )
  }

  // 报告日期
  pdf.setFontSize(10)
  const [ltR, ltG, ltB] = COLORS.lightText
  pdf.setTextColor(ltR, ltG, ltB)
  const reportDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  pdf.text(`报告生成日期：${reportDate}`, infoStartX, infoY + 30)

  // 底部装饰条
  pdf.setFillColor(pR, pG, pB)
  pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F')

  // ===== 成长数据表页 =====
  if (options?.includeGrowthTable !== false && growthRecords.length > 0) {
    pdf.addPage()

    // 页面背景
    pdf.setFillColor(bgR, bgG, bgB)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    // 标题
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.setTextColor(tR, tG, tB)
    pdf.text('成长数据记录', margin, margin + 10)

    // 绘制表格
    const tableData = growthRecords.map((record) => {
      const date = new Date(record.recordDate).toLocaleDateString('zh-CN')
      return [
        date,
        record.height ? `${record.height} cm` : '-',
        record.weight ? `${record.weight} kg` : '-',
        record.headCircumference ? `${record.headCircumference} cm` : '-',
        record.notes || '-',
      ]
    })

    autoTable(pdf, {
      startY: margin + 20,
      head: [['日期', '身高', '体重', '头围', '备注']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [pR, pG, pB],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [255, 252, 248],
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: margin, right: margin },
    })

    // 统计摘要
    const lastRecord = growthRecords[growthRecords.length - 1]
    const firstRecord = growthRecords[0]

    if (lastRecord && firstRecord) {
      const statsY = (pdf as any).lastAutoTable.finalY + 15

      pdf.setFillColor(255, 255, 255)
      pdf.roundedRect(margin, statsY, pageWidth - margin * 2, 35, 3, 3, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(pR, pG, pB)
      pdf.text('成长小结', margin + 10, statsY + 10)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(tR, tG, tB)

      if (lastRecord.height && firstRecord.height) {
        const heightChange = lastRecord.height - firstRecord.height
        pdf.text(
          `身高增长：+${heightChange.toFixed(1)} cm`,
          margin + 10,
          statsY + 20,
        )
      }

      if (lastRecord.weight && firstRecord.weight) {
        const weightChange = lastRecord.weight - firstRecord.weight
        pdf.text(
          `体重增长：+${weightChange.toFixed(1)} kg`,
          margin + 70,
          statsY + 20,
        )
      }

      pdf.text(
        `记录次数：${growthRecords.length} 次`,
        margin + 130,
        statsY + 20,
      )
    }
  }

  // ===== 里程碑页 =====
  if (options?.includeMilestones !== false && milestones.length > 0) {
    pdf.addPage()

    // 页面背景
    pdf.setFillColor(bgR, bgG, bgB)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    // 标题
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.setTextColor(tR, tG, tB)
    pdf.text('成长里程碑', margin, margin + 10)

    // 按类别分组
    const categories = ['gross_motor', 'fine_motor', 'language', 'cognitive', 'social']
    const categoryNames: Record<string, string> = {
      gross_motor: '大动作',
      fine_motor: '精细动作',
      language: '语言',
      cognitive: '认知',
      social: '社交',
    }

    let currentY = margin + 25

    for (const category of categories) {
      const categoryMilestones = milestones.filter(
        (m) => m.category === category,
      )
      if (categoryMilestones.length === 0) continue

      // 检查是否需要换页
      if (currentY > pageHeight - 50) {
        pdf.addPage()
        pdf.setFillColor(bgR, bgG, bgB)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        currentY = margin + 10
      }

      // 类别标题
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(pR, pG, pB)
      pdf.text(categoryNames[category] || category, margin, currentY)

      currentY += 8

      // 里程碑列表
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(tR, tG, tB)

      for (const milestone of categoryMilestones.slice(0, 5)) {
        const icon = milestone.achievedDate ? '✓' : '○'
        const date = milestone.achievedDate
          ? new Date(milestone.achievedDate).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })
          : `约${milestone.typicalMonth}月龄`

        pdf.text(`${icon} ${milestone.name}`, margin + 5, currentY)
        pdf.setTextColor(ltR, ltG, ltB)
        pdf.text(date, pageWidth - margin - 25, currentY)
        pdf.setTextColor(tR, tG, tB)

        currentY += 7
      }

      currentY += 5
    }
  }

  // ===== 页脚 =====
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(ltR, ltG, ltB)
    pdf.text(
      `第 ${i} 页 / 共 ${totalPages} 页`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' },
    )
    pdf.text(
      '宝宝成长相册 - 记录每一个珍贵时刻',
      margin,
      pageHeight - 8,
    )
  }

  return pdf
}

// 下载PDF
export function downloadGrowthReport(
  child: ChildInfo,
  growthRecords: GrowthRecord[],
  milestones: Milestone[],
  options?: { title?: string },
): void {
  const pdf = generateGrowthReportPDF(child, growthRecords, milestones, options)
  const filename = `${child.name}_成长报告_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}

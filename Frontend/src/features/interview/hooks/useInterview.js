import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context-value.js"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Could not generate the interview plan.")
            return null
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading, setReport ])

    const getReportById = useCallback(async (reportId) => {
        setLoading(true)
        setError("")
        try {
            const response = await getInterviewReportById(reportId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            setReport(null)
            setError(error.response?.data?.message || error.message || "Could not load the interview plan.")
            return null
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading, setReport ])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Could not load interview plans.")
            return []
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading, setReports ])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            setError(error.response?.data?.message || error.message || "Could not download the resume PDF.")
        } finally {
            setLoading(false)
        }
    }, [ setError, setLoading ])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ getReportById, getReports, interviewId ])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf }

}
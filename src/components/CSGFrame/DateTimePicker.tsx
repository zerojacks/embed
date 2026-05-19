import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
    value: number; // timestamp
    onChange: (timestamp: number) => void;
    placeholder?: string;
    className?: string;
    showSeconds?: boolean;
    showMilliseconds?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    placeholder = "选择日期时间",
    className = "",
    showSeconds = false,
    showMilliseconds = false
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(value));
    const [msValue, setMsValue] = useState<number>(new Date(value).getMilliseconds());
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const date = new Date(value);
        setSelectedDate(date);
        setMsValue(date.getMilliseconds());
    }, [value]);

    const handleDateChange = (date: Date | null) => {
        if (date) {
            const newDate = new Date(date);
            if (showMilliseconds) {
                newDate.setMilliseconds(msValue);
            }
            setSelectedDate(newDate);
            onChange(newDate.getTime());
            if (!showMilliseconds && !showSeconds) {
                setIsOpen(false);
            }
        }
    };

    const handleMsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value) || 0;
        val = Math.max(0, Math.min(999, val));
        setMsValue(val);
        const newDate = new Date(selectedDate);
        newDate.setMilliseconds(val);
        setSelectedDate(newDate);
        onChange(newDate.getTime());
    };

    const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
        <div className="relative flex-1">
            <input
                {...props}
                ref={ref}
                className={`input input-bordered input-primary w-full pr-10 ${className}`}
                placeholder={placeholder}
                readOnly
                onClick={() => setIsOpen(!isOpen)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                    />
                </svg>
            </div>
        </div>
    ));

    return (
        <div className="flex gap-2 items-center">
            <div className="relative flex-1">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    showTimeSelect
                    timeFormat={showSeconds ? "HH:mm:ss" : "HH:mm"}
                    timeIntervals={1}
                    dateFormat={showSeconds ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd HH:mm"}
                    customInput={<CustomInput />}
                    open={isOpen}
                    onClickOutside={() => setIsOpen(false)}
                    popperClassName="z-50"
                    calendarClassName="react-datepicker-custom"
                    dayClassName={() =>
                        "react-datepicker-day-custom"
                    }
                    timeClassName={() =>
                        "react-datepicker-time-custom"
                    }
                />
            </div>
            {showMilliseconds && (
                <div className="flex items-center gap-1 shrink-0">
                    <input
                        type="number"
                        className="input input-bordered input-primary w-20 text-center p-0"
                        value={msValue}
                        onChange={handleMsChange}
                        min={0}
                        max={999}
                        placeholder="ms"
                    />
                    <span className="text-xs font-bold">ms</span>
                </div>
            )}

            {/* Custom styles for react-datepicker */}
            <style>{`
                .react-datepicker-custom {
                    background-color: hsl(var(--b1)) !important;
                    border: 1px solid hsl(var(--b3)) !important;
                    color: hsl(var(--bc)) !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    border-radius: 0.5rem !important;
                }
                
                .react-datepicker__header {
                    background-color: hsl(var(--b2)) !important;
                    border-bottom: 1px solid hsl(var(--b3)) !important;
                    color: hsl(var(--bc)) !important;
                    border-top-left-radius: 0.5rem !important;
                    border-top-right-radius: 0.5rem !important;
                }
                
                .react-datepicker__current-month {
                    color: hsl(var(--bc)) !important;
                    font-weight: 600 !important;
                }
                
                .react-datepicker__day-names {
                    background-color: hsl(var(--b2)) !important;
                    border-bottom: 1px solid hsl(var(--b3)) !important;
                }
                
                .react-datepicker__day-name {
                    color: hsl(var(--bc) / 0.7) !important;
                    font-weight: 500 !important;
                }
                
                .react-datepicker__month {
                    background-color: hsl(var(--b1)) !important;
                }
                
                .react-datepicker-day-custom {
                    color: hsl(var(--bc)) !important;
                    border-radius: 0.5rem !important;
                    transition: all 0.2s !important;
                }
                
                .react-datepicker-day-custom:hover {
                    background-color: hsl(var(--p)) !important;
                    color: hsl(var(--pc)) !important;
                }
                
                .react-datepicker__day--selected {
                    background-color: hsl(var(--p)) !important;
                    color: hsl(var(--pc)) !important;
                }
                
                .react-datepicker__day--today {
                    background-color: hsl(var(--a)) !important;
                    color: hsl(var(--ac)) !important;
                }
                
                .react-datepicker__day--keyboard-selected {
                    background-color: hsl(var(--p) / 0.2) !important;
                    color: hsl(var(--bc)) !important;
                }
                
                .react-datepicker__navigation {
                    color: hsl(var(--bc)) !important;
                }
                
                .react-datepicker__navigation:hover {
                    color: hsl(var(--p)) !important;
                }
                
                /* 时间选择器样式修复 */
                .react-datepicker__time-container {
                    border-left: 1px solid hsl(var(--b3)) !important;
                    background-color: hsl(var(--b1)) !important;
                }
                
                .react-datepicker__time {
                    background-color: hsl(var(--b1)) !important;
                    border-bottom-right-radius: 0.5rem !important;
                }
                
                .react-datepicker__time-box {
                    background-color: hsl(var(--b1)) !important;
                }
                
                .react-datepicker__header--time {
                    background-color: hsl(var(--b2)) !important;
                    border-bottom: 1px solid hsl(var(--b3)) !important;
                    color: hsl(var(--bc)) !important;
                }
                
                .react-datepicker__time-name {
                    color: hsl(var(--bc)) !important;
                    font-weight: 600 !important;
                }
                
                .react-datepicker__time-list {
                    background-color: hsl(var(--b1)) !important;
                }
                
                .react-datepicker__time-list-item {
                    color: hsl(var(--bc)) !important;
                    background-color: transparent !important;
                    padding: 5px 10px !important;
                }
                
                .react-datepicker__time-list-item:hover {
                    background-color: hsl(var(--p)) !important;
                    color: hsl(var(--pc)) !important;
                }
                
                .react-datepicker__time-list-item--selected {
                    background-color: hsl(var(--p)) !important;
                    color: hsl(var(--pc)) !important;
                    font-weight: 600 !important;
                }
                
                .react-datepicker__time-list-item--disabled {
                    color: hsl(var(--bc) / 0.4) !important;
                }
                
                .react-datepicker-time-custom {
                    color: hsl(var(--bc)) !important;
                }
                
                .react-datepicker-time-custom:hover {
                    background-color: hsl(var(--p)) !important;
                    color: hsl(var(--pc)) !important;
                }
                
                .react-datepicker__triangle {
                    display: none !important;
                }
                
                .react-datepicker-popper {
                    z-index: 50 !important;
                }
                
                /* 确保整个弹出框不透明 */
                .react-datepicker-popper .react-datepicker {
                    background-color: hsl(var(--b1)) !important;
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default DateTimePicker;
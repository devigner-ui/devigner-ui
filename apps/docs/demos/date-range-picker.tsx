"use client";

import { useState } from "react";
import { DateRangePicker } from "devignerui";

export default function DateRangePickerDemo() {
  const [today] = useState(() => new Date());
  return <DateRangePicker minDate={today} />;
}

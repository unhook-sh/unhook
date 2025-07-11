'use client';

import { useUser } from '@clerk/nextjs/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@unhook/ui/alert-dialog';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { Input } from '@unhook/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { toast } from '@unhook/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { format, fromUnixTime } from 'date-fns';
import { ArrowUpDown, MoreHorizontal, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  getOrgMembersAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from '../actions';
import type { Member, Role } from '../types';
import { InviteMemberDialog } from './invite-member-dialog';

export function MembersSection() {
  const params = useParams<{ orgId: string }>();
  const { user } = useUser();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getOrgMembersAction({
        orgId: params.orgId,
      });

      if (!result) {
        throw new Error('Failed to fetch members');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      if (!result.data) {
        throw new Error('No data returned from server');
      }

      setMembers(result.data.data ?? []);
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to fetch members',
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteMember = async (email: string, role: Role) => {
    try {
      setIsLoading(true);
      const result = await inviteMemberAction({
        email,
        orgId: params.orgId,
        role,
      });

      if (!result) {
        throw new Error('Failed to invite member');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Invitation sent', {
        description: `Invitation sent to ${email}`,
      });
      setIsInviteDialogOpen(false);
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to invite member',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: Role) => {
    try {
      setIsLoading(true);
      const result = await updateMemberRoleAction({
        orgId: params.orgId,
        role,
        userId,
      });

      if (!result) {
        throw new Error('Failed to update role');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Role updated', {
        description: 'Member role updated successfully',
      });
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMemberId) return;

    try {
      setIsLoading(true);
      const result = await removeMemberAction({
        orgId: params.orgId,
        userId: selectedMemberId,
      });

      if (!result) {
        throw new Error('Failed to remove member');
      }

      if (result.validationErrors) {
        throw new Error('Invalid input data');
      }

      toast.success('Member removed', {
        description: 'Member removed successfully',
      });
      setIsAlertOpen(false);
      setSelectedMemberId(null);
      await fetchMembers();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to remove member',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorFn: (row) =>
        `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        const rowValue = row.getValue(columnId);
        if (typeof rowValue === 'string') {
          return rowValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        return false;
      },
      header: ({ column }) => (
        <Button
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Email
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <Button
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Role
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'joinedAt',
      cell: ({ row }) =>
        format(fromUnixTime(row.original.joinedAt), 'MMM d, yyyy'),
      header: ({ column }) => (
        <Button
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          variant="ghost"
        >
          Joined
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
    },
    {
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.userId === user?.userId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-8" size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={isCurrentUser || member.role === 'Admin'}
                onClick={() => handleUpdateRole(member.userId, 'Admin')}
              >
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isCurrentUser || member.role === 'Member'}
                onClick={() => handleUpdateRole(member.userId, 'Member')}
              >
                Make Member
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isCurrentUser}
                onClick={() => {
                  setSelectedMemberId(member.userId);
                  setIsAlertOpen(true);
                }}
              >
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
      id: 'actions',
    },
  ];

  const table = useReactTable({
    columns,
    data: members,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
      sorting,
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Manage your team members and their roles. Admins have full access to
        manage the organization, while Members have limited permissions.
      </p>

      <AlertDialog onOpenChange={setIsAlertOpen} open={isAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose
              access to all resources in this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMemberId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-primary"
              onClick={handleRemoveMember}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center gap-2 py-4">
        <Input
          className="max-w-sm"
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          placeholder="Filter by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        />
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsInviteDialogOpen(true)}
          variant="outline"
        >
          <Plus className="size-4" />
          Invite Member
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false} mode="popLayout">
              {table.getRowModel().rows?.length ? (
                [
                  ...table.getRowModel().rows.map((row) => (
                    <motion.tr
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      exit={{ opacity: 0, y: -10 }}
                      initial={{ opacity: 0, y: -10 }}
                      key={row.id}
                      transition={{ duration: 0.2 }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </motion.tr>
                  )),
                  isLoading && (
                    <motion.tr
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      key="loading"
                    >
                      <TableCell
                        className="h-12 text-center border-t"
                        colSpan={columns.length}
                      >
                        <div className="flex items-center justify-center">
                          <Icons.Spinner className="size-4 animate-spin" />
                        </div>
                      </TableCell>
                    </motion.tr>
                  ),
                ].filter(Boolean)
              ) : (
                <motion.tr
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                >
                  <TableCell
                    className="h-24 text-center"
                    colSpan={columns.length}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Icons.Spinner className="size-6 animate-spin" />
                      </div>
                    ) : (
                      'No results.'
                    )}
                  </TableCell>
                </motion.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows per page</p>
          <Select
            onValueChange={(value) => handlePageSizeChange(Number(value))}
            value={pageSize.toString()}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            disabled={currentPage === 0}
            onClick={() => handlePageChange(currentPage - 1)}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={currentPage >= Math.ceil(members.length / pageSize) - 1}
            onClick={() => handlePageChange(currentPage + 1)}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>

      <InviteMemberDialog
        isLoading={isLoading}
        onInvite={handleInviteMember}
        onOpenChange={setIsInviteDialogOpen}
        open={isInviteDialogOpen}
      />
    </div>
  );
}
